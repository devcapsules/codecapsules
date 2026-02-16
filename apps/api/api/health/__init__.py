# Azure Functions health check
import json
import logging
from datetime import datetime
import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Health check function processed a request.')
    
    health_data = {
        "status": "healthy",
        "service": "codecapsule-ai-engine",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    return func.HttpResponse(
        json.dumps(health_data),
        status_code=200,
        mimetype="application/json",
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    )