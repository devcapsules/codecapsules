# ══════════════════════════════════════════════════════════════════════════════
# Lambda Container for Heavy Language Execution
# 
# This container runs Piston for Java, C++, and C execution.
# Used as Tier 2 execution (only ~20% of requests).
# ══════════════════════════════════════════════════════════════════════════════

FROM public.ecr.aws/lambda/nodejs:18

# Install build tools for C/C++
RUN yum install -y gcc gcc-c++ make

# Install Java (OpenJDK 17)
RUN yum install -y java-17-amazon-corretto-devel

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Create execution directories
RUN mkdir -p /tmp/executions
RUN chmod 777 /tmp/executions

# Copy handler code
COPY dist/ ${LAMBDA_TASK_ROOT}/
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install Node dependencies
WORKDIR ${LAMBDA_TASK_ROOT}
RUN npm ci --omit=dev

# Set handler
CMD ["handler.execute"]
