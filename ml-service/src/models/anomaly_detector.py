"""
Anomaly Detector using Isolation Forest + LSTM Autoencoder ensemble
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
from typing import Dict, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Ensemble anomaly detector combining:
    1. Isolation Forest (unsupervised outlier detection)
    2. LSTM Autoencoder (time-series reconstruction error)
    """

    def __init__(self):
        self.isolation_forest: Optional[IsolationForest] = None
        self.lstm_autoencoder: Optional[keras.Model] = None
        self.scaler = StandardScaler()
        self.version = "0.1.0"
        self.trained_at: Optional[datetime] = None
        self.accuracy: Optional[float] = None

    async def initialize(self):
        """Initialize models (lazy loading)"""
        logger.info("Initializing Anomaly Detector...")

        # Initialize Isolation Forest
        self.isolation_forest = IsolationForest(
            contamination=0.05,  # 5% expected anomalies
            random_state=42,
            n_estimators=100,
            max_samples='auto',
            n_jobs=-1,  # Use all CPU cores
        )

        # Initialize LSTM Autoencoder architecture
        self.lstm_autoencoder = self._build_lstm_autoencoder(
            timesteps=30,  # 30-day window
            n_features=5,  # price, quantity, change_rate, rolling_avg_7d, rolling_avg_30d
        )

        self.trained_at = datetime.now()
        logger.info("✅ Anomaly Detector initialized")

    def _build_lstm_autoencoder(self, timesteps: int, n_features: int) -> keras.Model:
        """
        Build LSTM Autoencoder architecture

        Encoder: Compresses time-series into latent representation
        Decoder: Reconstructs original time-series
        High reconstruction error = anomaly
        """
        # Input shape: (timesteps, n_features)
        input_layer = keras.Input(shape=(timesteps, n_features))

        # Encoder
        encoded = keras.layers.LSTM(128, activation='relu', return_sequences=True)(input_layer)
        encoded = keras.layers.Dropout(0.2)(encoded)
        encoded = keras.layers.LSTM(64, activation='relu', return_sequences=False)(encoded)
        encoded = keras.layers.Dropout(0.2)(encoded)

        # Latent representation
        latent = keras.layers.Dense(32, activation='relu')(encoded)

        # Decoder
        decoded = keras.layers.RepeatVector(timesteps)(latent)
        decoded = keras.layers.LSTM(64, activation='relu', return_sequences=True)(decoded)
        decoded = keras.layers.Dropout(0.2)(decoded)
        decoded = keras.layers.LSTM(128, activation='relu', return_sequences=True)(decoded)
        decoded = keras.layers.Dropout(0.2)(decoded)

        # Output layer (reconstruction)
        output_layer = keras.layers.TimeDistributed(keras.layers.Dense(n_features))(decoded)

        # Compile model
        autoencoder = keras.Model(inputs=input_layer, outputs=output_layer)
        autoencoder.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )

        return autoencoder

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Feature engineering for anomaly detection

        Features:
        1. Raw values (price, quantity)
        2. Rate of change (% change from previous)
        3. Rolling averages (7-day, 30-day)
        4. Supplier patterns (historical avg per supplier)
        """
        df = df.copy()
        df = df.sort_values('timestamp')

        # Calculate rate of change
        df['price_change_rate'] = df['price'].pct_change().fillna(0)
        df['quantity_change_rate'] = df['quantity'].pct_change().fillna(0)

        # Rolling averages
        df['price_rolling_7d'] = df['price'].rolling(window=7, min_periods=1).mean()
        df['price_rolling_30d'] = df['price'].rolling(window=30, min_periods=1).mean()
        df['quantity_rolling_7d'] = df['quantity'].rolling(window=7, min_periods=1).mean()
        df['quantity_rolling_30d'] = df['quantity'].rolling(window=30, min_periods=1).mean()

        # Deviation from rolling average
        df['price_deviation_7d'] = (df['price'] - df['price_rolling_7d']) / df['price_rolling_7d'].replace(0, 1)
        df['quantity_deviation_7d'] = (df['quantity'] - df['quantity_rolling_7d']) / df['quantity_rolling_7d'].replace(0, 1)

        return df

    async def detect(self, data: pd.DataFrame, sensitivity: float = 0.05) -> Dict:
        """
        Detect anomalies in inventory data

        Args:
            data: DataFrame with columns [timestamp, sku, quantity, price, supplier_id, warehouse_id]
            sensitivity: Contamination factor (0.01-0.2, default 0.05 = 5% expected anomalies)

        Returns:
            Dict with is_anomaly, confidence, anomaly_type, severity, explanation
        """
        # Feature engineering
        df = self._engineer_features(data)

        # Select features for model
        feature_cols = [
            'price', 'quantity',
            'price_change_rate', 'quantity_change_rate',
            'price_deviation_7d', 'quantity_deviation_7d',
        ]

        X = df[feature_cols].fillna(0).values

        # Method 1: Isolation Forest (unsupervised)
        if_predictions = self.isolation_forest.fit_predict(X)
        if_scores = self.isolation_forest.score_samples(X)

        # Anomaly if prediction is -1
        is_anomaly_if = if_predictions[-1] == -1
        if_confidence = abs(if_scores[-1])  # More negative = more anomalous

        # Mock LSTM prediction for now (TODO: Implement training pipeline)
        is_anomaly_lstm = False
        lstm_confidence = 0.0

        # Ensemble: Combine both methods
        is_anomaly = is_anomaly_if or is_anomaly_lstm
        confidence = max(if_confidence, lstm_confidence)

        # Determine anomaly type
        anomaly_type = None
        severity = "low"

        if is_anomaly:
            latest = df.iloc[-1]

            # Price spike detection
            if abs(latest['price_deviation_7d']) > 0.5:  # 50% deviation
                anomaly_type = "price_spike"
                severity = "high" if abs(latest['price_deviation_7d']) > 1.0 else "medium"

            # Impossible quantity (negative or extremely high)
            elif latest['quantity'] < 0 or abs(latest['quantity_deviation_7d']) > 5.0:
                anomaly_type = "impossible_quantity"
                severity = "critical"

            # Stock jump (sudden large increase/decrease)
            elif abs(latest['quantity_change_rate']) > 2.0:  # 200% change
                anomaly_type = "stock_jump"
                severity = "medium"

            else:
                anomaly_type = "general_anomaly"
                severity = "low"

        # Generate explanation
        explanation = self._generate_explanation(
            is_anomaly=is_anomaly,
            anomaly_type=anomaly_type,
            data=df.iloc[-1] if is_anomaly else None
        )

        # Recommended action
        recommended_action = self._get_recommended_action(anomaly_type, severity)

        return {
            "is_anomaly": is_anomaly,
            "confidence": float(confidence),
            "anomaly_type": anomaly_type,
            "severity": severity,
            "explanation": explanation,
            "recommended_action": recommended_action,
        }

    def _generate_explanation(self, is_anomaly: bool, anomaly_type: Optional[str], data: Optional[pd.Series]) -> str:
        """Generate human-readable explanation"""
        if not is_anomaly:
            return "No anomaly detected. Inventory data is within normal parameters."

        if anomaly_type == "price_spike":
            deviation = data['price_deviation_7d'] * 100
            return f"Price spike detected: {deviation:.1f}% deviation from 7-day average (€{data['price_rolling_7d']:.2f})"

        elif anomaly_type == "impossible_quantity":
            return f"Impossible quantity detected: {data['quantity']} (expected range: 0-{data['quantity_rolling_30d'] * 2:.0f})"

        elif anomaly_type == "stock_jump":
            change = data['quantity_change_rate'] * 100
            return f"Sudden stock change: {change:.1f}% from previous period"

        else:
            return "General anomaly detected based on historical patterns"

    def _get_recommended_action(self, anomaly_type: Optional[str], severity: str) -> str:
        """Get recommended action based on anomaly type"""
        actions = {
            "price_spike": "🔍 Verify ERP data sync. Check supplier pricing updates.",
            "impossible_quantity": "🚨 URGENT: Manual verification required. Likely data sync error.",
            "stock_jump": "📊 Review recent orders and deliveries. May be legitimate seasonal spike.",
            "general_anomaly": "⚠️ Monitor closely. Flag for human review.",
        }

        action = actions.get(anomaly_type, "⚠️ Review and verify data accuracy.")

        if severity == "critical":
            action = f"🚨 CRITICAL: {action} Pause automated sync until resolved."

        return action
