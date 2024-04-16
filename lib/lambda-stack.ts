import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const checkDocumentTypeFunction = new NodejsFunction(this, 'CheckDocumentType', {
      runtime: Runtime.NODEJS_20_X,
      functionName: "CheckDocumentType",
      handler: 'handler',
      entry: 'document-type.lambda/index.ts',
      bundling: {
        externalModules: ['aws-sdk'],
        minify: false,
        metafile: true,
      },
    });

    this.updateLambdaPolicy(checkDocumentTypeFunction)

    const checkDocumentFunction = new NodejsFunction(this, 'CheckDocumentResult', {
      runtime: Runtime.NODEJS_20_X,
      functionName: "CheckDocumentResult",
      handler: 'handler',
      entry: 'document-result.lambda/index.ts',
      
      bundling: {
        externalModules: ['aws-sdk'],
        minify: false,
        metafile: true,
      },
    });

    this.updateLambdaPolicy(checkDocumentFunction)

    // allow lambda to access s3 bucket


    // subscribe lambda checkDocumentTypeFunction to SNS topic DocumentTypeProcessed
    const topic = Topic.fromTopicArn(this, 'DocumentTypeProcessed', 'arn:aws:sns:ap-southeast-2:732757519306:DocumentTypeProcessed')
    topic.addSubscription(new LambdaSubscription(checkDocumentTypeFunction));

    const documentProcessedTopic = Topic.fromTopicArn(this, 'DocumentProcessed', 'arn:aws:sns:ap-southeast-2:732757519306:DocumentProcessed')
    documentProcessedTopic.addSubscription(new LambdaSubscription(checkDocumentFunction));

    const sqs = new Queue(this, 'DocumentQueue', {
      queueName: 'DocumentParsedQueue'
    });
  }

  private updateLambdaPolicy(lambda: NodejsFunction) {
    lambda.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["s3:*"],
        resources: ["arn:aws:s3:::hackathon-textract-results/*", "arn:aws:s3:::hackathon-documents/*"]
      })
    );
    // allow StartDocumentAnalysisCommand to be executed
    lambda.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["textract:StartDocumentAnalysis", "dynamodb:*", "sqs:*"],
        resources: ["*"]
      })
    );
  }
}
