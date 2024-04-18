# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

# Architecture diagram

![Architecture diagram](./form-professor.drawio.png)

# Future thoughts

This is POC solution how in no time we can use extract to read documents. 

In future we can combine it with AWS Bedrock and custom llm model to guide process. Potentially spinning agent and giving it Swagger API to interact based on it query documents dynamically.