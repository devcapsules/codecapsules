# Use AWS Lambda Python base image and add Java
FROM public.ecr.aws/lambda/python:3.12

# Install Java (Amazon Corretto 17)
RUN dnf install -y java-17-amazon-corretto-devel && \
    dnf clean all

# Copy the Lambda function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}/
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install Python dependencies for the Lambda handler
RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# Create workspace directory for Java compilation
RUN mkdir -p /tmp/workspace && chmod 777 /tmp/workspace

# Set environment variables
ENV JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto
ENV PATH=${JAVA_HOME}/bin:${PATH}

# Verify Java installation
RUN java -version && javac -version

# Set the CMD to your handler
CMD [ "lambda_function.lambda_handler" ]