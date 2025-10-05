"""
Demand Forecaster using Prophet + LSTM ensemble
"""

import numpy as np
import pandas as pd
from prophet import Prophet
import tensorflow as tf
from tensorflow import keras
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error, mean_absolute_error
from typing import Dict, List
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class DemandForecaster:
    """
    Ensemble demand forecaster combining:
    1. Prophet (seasonal decomposition, trend analysis)
    2. LSTM (deep learning for complex patterns)
    """

    def __init__(self):
        self.prophet_model: Optional[Prophet] = None
        self.lstm_model: Optional[keras.Model] = None
        self.version = "0.1.0"
        self.trained_at: Optional[datetime] = None
        self.metrics: Dict = {}

    async def initialize(self):
        """Initialize models"""
        logger.info("Initializing Demand Forecaster...")

        # Initialize Prophet with seasonality
        self.prophet_model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.05,
        )

        # Initialize LSTM architecture
        self.lstm_model = self._build_lstm_forecaster(
            lookback_window=30,  # 30-day history
            n_features=3,  # quantity, trend, seasonality
        )

        self.trained_at = datetime.now()
        logger.info("✅ Demand Forecaster initialized")

    def _build_lstm_forecaster(self, lookback_window: int, n_features: int) -> keras.Model:
        """
        Build LSTM forecasting architecture

        Input: Historical time-series (lookback_window days)
        Output: Next-day demand prediction
        """
        model = keras.Sequential([
            keras.layers.LSTM(128, activation='relu', return_sequences=True, input_shape=(lookback_window, n_features)),
            keras.layers.Dropout(0.2),
            keras.layers.LSTM(64, activation='relu', return_sequences=False),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(1, activation='linear'),  # Regression output
        ])

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )

        return model

    def _prepare_prophet_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare data for Prophet model

        Prophet requires:
        - 'ds' column (datetime)
        - 'y' column (target variable)
        """
        prophet_df = pd.DataFrame({
            'ds': pd.to_datetime(df['timestamp']),
            'y': df['quantity'],
        })

        return prophet_df.sort_values('ds')

    def _prepare_lstm_data(self, df: pd.DataFrame, lookback_window: int = 30):
        """
        Prepare sliding window sequences for LSTM

        Creates sequences of (lookback_window) timesteps
        """
        data = df[['quantity']].values

        X, y = [], []
        for i in range(lookback_window, len(data)):
            X.append(data[i-lookback_window:i])
            y.append(data[i])

        return np.array(X), np.array(y)

    async def forecast(self, historical_data: pd.DataFrame, horizon: int = 7) -> Dict:
        """
        Forecast future demand

        Args:
            historical_data: DataFrame with columns [timestamp, sku, quantity, price]
            horizon: Number of days to forecast (1-30)

        Returns:
            Dict with forecasts, model_type, accuracy_metrics, confidence
        """
        # Prepare data
        historical_data = historical_data.sort_values('timestamp')

        # Method 1: Prophet forecasting
        prophet_df = self._prepare_prophet_data(historical_data)

        # Train Prophet (fast, handles seasonality well)
        self.prophet_model.fit(prophet_df)

        # Generate forecast
        future_dates = self.prophet_model.make_future_dataframe(periods=horizon, freq='D')
        prophet_forecast = self.prophet_model.predict(future_dates)

        # Extract forecasts for future dates only
        prophet_predictions = prophet_forecast.tail(horizon)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]

        # Method 2: LSTM forecasting (mock for now - would require training pipeline)
        # TODO: Implement LSTM training and prediction
        lstm_predictions = None  # Placeholder

        # Ensemble: Use Prophet for now (can add LSTM weighting later)
        forecasts = []
        for _, row in prophet_predictions.iterrows():
            forecasts.append({
                "date": row['ds'].strftime('%Y-%m-%d'),
                "quantity_predicted": max(0, int(row['yhat'])),  # Ensure non-negative
                "lower_bound": max(0, int(row['yhat_lower'])),
                "upper_bound": int(row['yhat_upper']),
            })

        # Calculate accuracy metrics (on historical data)
        accuracy_metrics = self._calculate_accuracy_metrics(
            actual=prophet_df['y'].values,
            predicted=prophet_forecast.head(len(prophet_df))['yhat'].values
        )

        # Confidence score (based on prediction interval width)
        avg_interval_width = (prophet_predictions['yhat_upper'] - prophet_predictions['yhat_lower']).mean()
        avg_prediction = prophet_predictions['yhat'].mean()
        confidence = max(0.0, min(1.0, 1.0 - (avg_interval_width / avg_prediction) / 2))

        return {
            "forecasts": forecasts,
            "model_type": "prophet",  # Will be "ensemble" when LSTM is added
            "accuracy_metrics": accuracy_metrics,
            "confidence": float(confidence),
        }

    def _calculate_accuracy_metrics(self, actual: np.ndarray, predicted: np.ndarray) -> Dict:
        """
        Calculate forecast accuracy metrics

        Metrics:
        - MAPE (Mean Absolute Percentage Error) - lower is better, target <15%
        - RMSE (Root Mean Squared Error) - penalizes large errors
        - MAE (Mean Absolute Error) - average absolute difference
        """
        # Filter out zero values to avoid division by zero in MAPE
        mask = actual != 0
        actual_filtered = actual[mask]
        predicted_filtered = predicted[mask]

        mape = mean_absolute_percentage_error(actual_filtered, predicted_filtered) * 100
        rmse = np.sqrt(mean_squared_error(actual, predicted))
        mae = mean_absolute_error(actual, predicted)

        return {
            "mape": round(float(mape), 2),  # Percentage
            "rmse": round(float(rmse), 2),
            "mae": round(float(mae), 2),
        }
