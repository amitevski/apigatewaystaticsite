# How to host a serverless static website on AWS with API Gateway

This repository is part of a blog post at https://acomitevski.medium.com/how-to-host-a-serverless-static-website-on-aws-with-api-gateway-39f104b814a9

## Deploying the sample

Prerequisites:
* npm
* yarn
* cdk
* aws credentials for the account you want to deploy to are configured

### Steps
1. in the docs folder execute `yarn install && yarn build`
1. in the cdk folder execute `npm install && cdk synth && cdk deploy`
1. The API Gateway URL will be printed to the console
