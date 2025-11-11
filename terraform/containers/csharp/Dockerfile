# C# Lambda container using AWS Lambda Python base + .NET 8 SDK
FROM public.ecr.aws/lambda/python:3.12

# Install dependencies including findutils and ICU for .NET installation
RUN dnf install -y wget tar gzip findutils libicu && dnf clean all

# Download and install .NET 8 SDK using Microsoft's installation script
RUN wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh && \
    chmod +x dotnet-install.sh && \
    ./dotnet-install.sh --version 8.0.404 --install-dir /opt/dotnet && \
    rm dotnet-install.sh

# Copy the Lambda function code
COPY lambda_function.py /var/task/
COPY requirements.txt /var/task/

# Install Python dependencies for the Lambda handler
RUN pip3 install -r requirements.txt --target "/var/task"

# Create workspace directory for C# compilation
RUN mkdir -p /tmp/workspace && chmod 777 /tmp/workspace

# Set environment variables
ENV DOTNET_ROOT=/opt/dotnet
ENV PATH=${DOTNET_ROOT}:${PATH}

# Verify .NET installation
RUN dotnet --version

# Set the CMD to your handler
CMD [ "lambda_function.lambda_handler" ]