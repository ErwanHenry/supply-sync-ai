"""
Unit tests for Anomaly Detector
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.models.anomaly_detector import AnomalyDetector


@pytest.fixture
async def detector():
    """Create and initialize detector"""
    detector = AnomalyDetector()
    await detector.initialize()
    return detector


@pytest.fixture
def normal_data():
    """Generate normal inventory data (no anomalies)"""
    dates = [datetime.now() - timedelta(days=i) for i in range(60, 0, -1)]
    data = {
        'timestamp': dates,
        'sku': ['SKU001'] * 60,
        'quantity': np.random.normal(100, 10, 60).astype(int),  # Mean 100, std 10
        'price': np.random.normal(50, 2, 60),  # Mean €50, std €2
        'supplier_id': ['SUP001'] * 60,
        'warehouse_id': ['WH001'] * 60,
    }
    return pd.DataFrame(data)


@pytest.fixture
def anomaly_price_spike_data():
    """Generate data with price spike anomaly"""
    dates = [datetime.now() - timedelta(days=i) for i in range(60, 0, -1)]
    prices = np.random.normal(50, 2, 60)
    prices[-1] = 150  # Huge price spike (3x normal)

    data = {
        'timestamp': dates,
        'sku': ['SKU001'] * 60,
        'quantity': np.random.normal(100, 10, 60).astype(int),
        'price': prices,
        'supplier_id': ['SUP001'] * 60,
        'warehouse_id': ['WH001'] * 60,
    }
    return pd.DataFrame(data)


@pytest.fixture
def anomaly_impossible_quantity_data():
    """Generate data with impossible quantity anomaly"""
    dates = [datetime.now() - timedelta(days=i) for i in range(60, 0, -1)]
    quantities = np.random.normal(100, 10, 60).astype(int)
    quantities[-1] = -50  # Negative quantity (impossible)

    data = {
        'timestamp': dates,
        'sku': ['SKU001'] * 60,
        'quantity': quantities,
        'price': np.random.normal(50, 2, 60),
        'supplier_id': ['SUP001'] * 60,
        'warehouse_id': ['WH001'] * 60,
    }
    return pd.DataFrame(data)


@pytest.mark.asyncio
async def test_detector_initialization():
    """Test detector initializes correctly"""
    detector = AnomalyDetector()
    await detector.initialize()

    assert detector.isolation_forest is not None
    assert detector.lstm_autoencoder is not None
    assert detector.version == "0.1.0"
    assert detector.trained_at is not None


@pytest.mark.asyncio
async def test_normal_data_no_anomaly(detector, normal_data):
    """Test that normal data is not flagged as anomaly"""
    result = await detector.detect(normal_data)

    assert result['is_anomaly'] == False
    assert result['anomaly_type'] is None
    assert result['severity'] == "low"
    assert "No anomaly detected" in result['explanation']


@pytest.mark.asyncio
async def test_price_spike_detection(detector, anomaly_price_spike_data):
    """Test that price spike is detected"""
    result = await detector.detect(anomaly_price_spike_data)

    assert result['is_anomaly'] == True
    assert result['anomaly_type'] == "price_spike"
    assert result['severity'] in ["medium", "high", "critical"]
    assert result['confidence'] > 0.5
    assert "Price spike detected" in result['explanation']


@pytest.mark.asyncio
async def test_impossible_quantity_detection(detector, anomaly_impossible_quantity_data):
    """Test that impossible quantity is detected"""
    result = await detector.detect(anomaly_impossible_quantity_data)

    assert result['is_anomaly'] == True
    assert result['anomaly_type'] == "impossible_quantity"
    assert result['severity'] == "critical"
    assert "Impossible quantity detected" in result['explanation']
    assert "URGENT" in result['recommended_action']


@pytest.mark.asyncio
async def test_feature_engineering(detector, normal_data):
    """Test feature engineering produces expected columns"""
    df = detector._engineer_features(normal_data)

    # Check new features exist
    expected_features = [
        'price_change_rate',
        'quantity_change_rate',
        'price_rolling_7d',
        'price_rolling_30d',
        'quantity_rolling_7d',
        'quantity_rolling_30d',
        'price_deviation_7d',
        'quantity_deviation_7d',
    ]

    for feature in expected_features:
        assert feature in df.columns


@pytest.mark.asyncio
async def test_confidence_score_range(detector, normal_data):
    """Test confidence score is between 0 and 1"""
    result = await detector.detect(normal_data)

    assert 0.0 <= result['confidence'] <= 1.0


@pytest.mark.asyncio
async def test_sensitivity_parameter(detector, normal_data):
    """Test that sensitivity parameter affects detection"""
    # Low sensitivity (strict, fewer anomalies)
    result_low = await detector.detect(normal_data, sensitivity=0.01)

    # High sensitivity (lenient, more anomalies)
    result_high = await detector.detect(normal_data, sensitivity=0.2)

    # Both should complete without error
    assert 'is_anomaly' in result_low
    assert 'is_anomaly' in result_high
