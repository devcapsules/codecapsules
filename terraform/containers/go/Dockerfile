# Go Lambda container using AWS Lambda Python base + Go 1.21
FROM public.ecr.aws/lambda/python:3.12

# Install Go 1.21
RUN dnf install -y wget tar gzip && dnf clean all

# Download and install Go 1.21
RUN wget https://go.dev/dl/go1.21.11.linux-amd64.tar.gz -O go.tar.gz && tar -xzf go.tar.gz -C /usr/local && rm go.tar.gz

# Copy the Lambda function code
COPY lambda_function.py /var/task/
COPY requirements.txt /var/task/

# Install Python dependencies for the Lambda handler
RUN pip3 install -r requirements.txt --target "/var/task"

# Create workspace directory for Go compilation
RUN mkdir -p /tmp/workspace && chmod 777 /tmp/workspace

# Set environment variables
ENV GOROOT=/usr/local/go
ENV PATH=${GOROOT}/bin:${PATH}

# Verify Go installation
RUN go version

# Set the CMD to your handler
CMD [ "lambda_function.lambda_handler" ]