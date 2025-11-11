# Dockerfile for Go Judge Lambda Function
FROM public.ecr.aws/lambda/provided:al2-x86_64

# Install Go compiler
RUN yum update -y && \
    yum install -y wget tar && \
    wget https://golang.org/dl/go1.21.5.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz && \
    yum remove -y wget && \
    yum clean all

# Set Go environment
ENV PATH=$PATH:/usr/local/go/bin
ENV GOROOT=/usr/local/go
ENV GOPATH=/tmp/go

# Copy function source
COPY go-judge.go ${LAMBDA_TASK_ROOT}/
COPY go.mod ${LAMBDA_TASK_ROOT}/ 2>/dev/null || echo 'module go-judge\n\ngo 1.21\n\nrequire github.com/aws/aws-lambda-go v1.46.0' > ${LAMBDA_TASK_ROOT}/go.mod

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Initialize Go module if needed and build
RUN go mod tidy || go mod init go-judge && \
    go get github.com/aws/aws-lambda-go/lambda && \
    go build -o bootstrap go-judge.go

# Make bootstrap executable
RUN chmod +x bootstrap

# Lambda function handler (Go custom runtime uses bootstrap)
CMD ["./bootstrap"]