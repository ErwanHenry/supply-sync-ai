"""
SupplySync AI - ML Service
Main FastAPI application for anomaly detection and demand forecasting
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
from datetime import datetime

from src.models.anomaly_detector import AnomalyDetector
from src.models.demand_forecaster import DemandForecaster
from src.utils.logger import setup_logger

# Setup logging
logger = setup_logger()

# Initialize FastAPI app
app = FastAPI(
    title="SupplySync AI - ML Service",
    description="Anomaly Detection & Demand Forecasting for B2B Inventory",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML models (lazy loading)
anomaly_detector: Optional[AnomalyDetector] = None
demand_forecaster: Optional[DemandForecaster] = None


# Request/Response Models
class InventoryDataPoint(BaseModel):
    """Single inventory data point"""
    timestamp: datetime
    sku: str
    quantity: int
    price: float
    supplier_id: Optional[str] = None
    warehouse_id: Optional[str] = None


class AnomalyDetectionRequest(BaseModel):
    """Request for anomaly detection"""
    data_points: List[InventoryDataPoint] = Field(..., min_items=30)
    sensitivity: float = Field(0.05, ge=0.01, le=0.2)  # Contamination factor


class AnomalyDetectionResponse(BaseModel):
    """Response from anomaly detection"""
    is_anomaly: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    anomaly_type: Optional[str] = None  # price_spike, impossible_quantity, stock_jump
    severity: str  # low, medium, high, critical
    explanation: str
    recommended_action: str


class DemandForecastRequest(BaseModel):
    """Request for demand forecasting"""
    historical_data: List[InventoryDataPoint] = Field(..., min_items=90)  # 3 months min
    forecast_horizon: int = Field(7, ge=1, le=30)  # Days to forecast


class DemandForecastResponse(BaseModel):
    """Response from demand forecasting"""
    forecasts: List[dict]  # {date, quantity_predicted, lower_bound, upper_bound}
    model_type: str  # prophet, lstm, ensemble
    accuracy_metrics: dict  # {mape, rmse, mae}
    confidence: float


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize ML models on startup"""
    global anomaly_detector, demand_forecaster

    logger.info("🚀 Starting ML Service...")

    # Initialize Anomaly Detector
    try:
        anomaly_detector = AnomalyDetector()
        await anomaly_detector.initialize()
        logger.info("✅ Anomaly Detector initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Anomaly Detector: {e}")
        anomaly_detector = None

    # Initialize Demand Forecaster
    try:
        demand_forecaster = DemandForecaster()
        await demand_forecaster.initialize()
        logger.info("✅ Demand Forecaster initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Demand Forecaster: {e}")
        demand_forecaster = None

    logger.info("🎉 ML Service ready!")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "0.1.0",
        "models": {
            "anomaly_detector": "ready" if anomaly_detector else "not_initialized",
            "demand_forecaster": "ready" if demand_forecaster else "not_initialized",
        },
    }


# Anomaly Detection endpoint
@app.post("/api/ml/detect-anomaly", response_model=AnomalyDetectionResponse)
async def detect_anomaly(request: AnomalyDetectionRequest):
    """
    Detect anomalies in inventory data

    Uses Isolation Forest + LSTM Autoencoder ensemble approach:
    1. Isolation Forest: Unsupervised outlier detection
    2. LSTM Autoencoder: Time-series reconstruction error
    3. Ensemble: Combine both for high-confidence predictions
    """
    if not anomaly_detector:
        raise HTTPException(status_code=503, detail="Anomaly Detector not initialized")

    try:
        logger.info(f"Detecting anomalies for {len(request.data_points)} data points")

        # Convert to pandas DataFrame
        import pandas as pd
        df = pd.DataFrame([dp.dict() for dp in request.data_points])

        # Run anomaly detection
        result = await anomaly_detector.detect(
            data=df,
            sensitivity=request.sensitivity
        )

        logger.info(f"Anomaly detected: {result['is_anomaly']} (confidence: {result['confidence']:.2f})")

        return AnomalyDetectionResponse(**result)

    except Exception as e:
        logger.error(f"Error in anomaly detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Demand Forecasting endpoint
@app.post("/api/ml/forecast-demand", response_model=DemandForecastResponse)
async def forecast_demand(request: DemandForecastRequest):
    """
    Forecast future demand using Prophet + LSTM ensemble

    Approach:
    1. Prophet: Seasonal decomposition (weekly, monthly patterns)
    2. LSTM: Deep learning for complex non-linear trends
    3. Ensemble: Weighted average based on historical accuracy
    """
    if not demand_forecaster:
        raise HTTPException(status_code=503, detail="Demand Forecaster not initialized")

    try:
        logger.info(f"Forecasting demand for {request.forecast_horizon} days")

        # Convert to pandas DataFrame
        import pandas as pd
        df = pd.DataFrame([dp.dict() for dp in request.historical_data])

        # Run demand forecasting
        result = await demand_forecaster.forecast(
            historical_data=df,
            horizon=request.forecast_horizon
        )

        logger.info(f"Forecast generated: {len(result['forecasts'])} predictions")

        return DemandForecastResponse(**result)

    except Exception as e:
        logger.error(f"Error in demand forecasting: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Model info endpoint
@app.get("/api/ml/models/info")
async def get_model_info():
    """Get information about loaded ML models"""
    info = {
        "anomaly_detector": None,
        "demand_forecaster": None,
    }

    if anomaly_detector:
        info["anomaly_detector"] = {
            "model_type": "Isolation Forest + LSTM Autoencoder",
            "version": anomaly_detector.version,
            "trained_at": anomaly_detector.trained_at,
            "accuracy": anomaly_detector.accuracy,
        }

    if demand_forecaster:
        info["demand_forecaster"] = {
            "model_type": "Prophet + LSTM Ensemble",
            "version": demand_forecaster.version,
            "trained_at": demand_forecaster.trained_at,
            "metrics": demand_forecaster.metrics,
        }

    return info


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "service": "SupplySync AI - ML Service",
        "version": "0.1.0",
        "endpoints": {
            "health": "/health",
            "detect_anomaly": "/api/ml/detect-anomaly",
            "forecast_demand": "/api/ml/forecast-demand",
            "model_info": "/api/ml/models/info",
        },
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
