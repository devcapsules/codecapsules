#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodeCapsuleStack } from '../lib/codecapsule-stack-simple';

const app = new cdk.App();

// Get environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const stackName = 'CodeCapsuleServerlessStack';

new CodeCapsuleStack(app, stackName, {
  env,
  description: 'CodeCapsule Serverless Execution Engine - Lambda Functions and API Gateway',
  tags: {
    Project: 'CodeCapsule',
    Environment: process.env.STAGE || 'dev',
    Owner: 'CodeCapsuleTeam',
    Purpose: 'ServerlessCodeExecution'
  }
});

app.synth();