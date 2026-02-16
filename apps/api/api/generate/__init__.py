# Azure Static Web Apps API Function
import json
import logging
import azure.functions as func
from azure.functions import HttpRequest, HttpResponse

# Main AI generation function
def main(req: HttpRequest) -> HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    
    try:
        # Get request body
        req_body = req.get_json()
        
        if not req_body:
            return HttpResponse(
                json.dumps({"error": "Request body is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # For now, return a mock response
        # TODO: Integrate with Azure OpenAI
        response_data = {
            "success": True,
            "generated": {
                "code": f"# Generated code for: {req_body.get('prompt', 'unknown')}",
                "explanation": "This is a mock response. Azure OpenAI integration coming soon.",
                "language": req_body.get('language', 'python')
            }
        }
        
        return HttpResponse(
            json.dumps(response_data),
            status_code=200,
            mimetype="application/json",
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        )
        
    except Exception as e:
        logging.error(f"Error in generate function: {str(e)}")
        return HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )