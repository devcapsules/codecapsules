# Dockerfile for Java Judge Lambda Function
FROM public.ecr.aws/lambda/python:3.12

# Install OpenJDK 17
RUN yum update -y && \
    yum install -y java-17-amazon-corretto-devel && \
    yum clean all

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto.x86_64

# Copy function code
COPY java-judge.py ${LAMBDA_TASK_ROOT}/

# Create security policy for Java execution
RUN echo 'grant { \
    permission java.io.FilePermission "<<ALL FILES>>", "read,write,delete"; \
    permission java.lang.RuntimePermission "createClassLoader"; \
    permission java.lang.RuntimePermission "getProtectionDomain"; \
    permission java.security.SecurityPermission "getPolicy"; \
    permission java.util.PropertyPermission "*", "read,write"; \
};' > /opt/java.policy

# Set permissions
RUN chmod 644 /opt/java.policy

# Lambda function handler
CMD ["java-judge.lambda_handler"]