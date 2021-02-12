import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deploy from "@aws-cdk/aws-s3-deployment";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as iam from "@aws-cdk/aws-iam";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    const bucketWebsite = new s3.Bucket(this, "WebsiteBucket");

    this.configureApiGateway(bucketWebsite);

    const appDeployment = new s3Deploy.BucketDeployment(
      this,
      `deploy-frontend`,
      {
          sources: [
              s3Deploy.Source.asset("../docs/src/.vuepress/dist")
          ],
          destinationBucket: bucketWebsite
      }
    );
  }

  private configureApiGateway(bucket: s3.IBucket) {
    const api = new apigateway.RestApi(
      this,
      "ApiGatewayS3Proxy",
      {
        restApiName: "StaticWebsite",
        endpointTypes: [apigateway.EndpointType.REGIONAL],
        binaryMediaTypes: [
          "application/javascript",
          "image/png",
          "image/jpeg",
          "application/font-woff2",
          "application/font-woff",
          "font/woff",
          "font/woff2",
        ],
      }
    );
    const apiGatewayS3ReadRole = new iam.Role(
      this,
      "ApiGatewayS3ReadRole",
      {
        assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
        path: "/",
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess")] // for production make this more granular.
      }
    );

    const indexPageIntegration = new apigateway.AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${bucket.bucketName}/index.html`,
      options: {
        credentialsRole: apiGatewayS3ReadRole,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": "integration.response.header.Content-Type",
              "method.response.header.Timestamp": "integration.response.header.Date"
            },
          },
        ],
      },
    });

    const guideIntegration = new apigateway.AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${bucket.bucketName}/guide/index.html`,
      options: {
        credentialsRole: apiGatewayS3ReadRole,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": "integration.response.header.Content-Type",
              "method.response.header.Timestamp": "integration.response.header.Date"
            },
          },
        ],
      },
    });

    const configIntegration = new apigateway.AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${bucket.bucketName}/config/index.html`,
      options: {
        credentialsRole: apiGatewayS3ReadRole,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": "integration.response.header.Content-Type",
              "method.response.header.Timestamp": "integration.response.header.Date"
            },
          },
        ],
      },
    });

    const assetsIntegration = new apigateway.AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${bucket.bucketName}/assets/{path}`,
      options: {
        credentialsRole: apiGatewayS3ReadRole,
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestParameters: {
          "integration.request.path.path": "method.request.path.path"
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": "integration.response.header.Content-Type",
              "method.response.header.Timestamp": "integration.response.header.Date"
            },
          },
        ],
      },
    });

    const methodOptions: apigateway.MethodOptions = { methodResponses: [
      { statusCode: '200', responseParameters: {"method.response.header.Content-Type": true, "method.response.header.Timestamp": true}},
      { statusCode: '400' },
      { statusCode: '500' }
    ]};

    const root = api.root;
    root.addMethod("GET", indexPageIntegration, methodOptions);
    root.addResource("guide").addMethod("GET", guideIntegration, methodOptions);
    root.addResource("config").addMethod("GET", configIntegration, methodOptions);
    const assets = root.addResource("assets");
    assets.addResource("{path+}").addMethod("GET", assetsIntegration, {...methodOptions, requestParameters: {"method.request.path.path": true}});
  }
}
