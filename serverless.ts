import type { AWS } from '@serverless/typescript';

const dir = __dirname;
let isWin = process.platform === "win32";
let DEFAULT_STAGE_NAME = 'demo'

let AWS_CDK_REMOVAL_SCRIPT_PATH = isWin ? `node ${dir}/\script.js` : `node ${dir}/script.js`;

const serverlessConfiguration: AWS = {
    service: "${file(./package.json):name}",
    custom: {
        webpackIncludeModules: true,
        stage: "${opt:stage, '"+DEFAULT_STAGE_NAME+"'}",
        stackName: "${self:custom.stage}-clients-ddb-manager-stack",
        webpack: {
            webpackConfig: "./webpack.config.js",
            includeModules: {
                forceExclude: ["aws-sdk"]
            },
            packagerOptions: {
                scripts: [AWS_CDK_REMOVAL_SCRIPT_PATH]
            }
        }
    },
    plugins: ["serverless-webpack"],
    package: {
        patterns: ["!node_modules/aws-sdk/**"],
        exclude: ["node_modules/aws-sdk/**"],
        excludeDevDependencies: true
    },
    provider: {
        name: "aws",
        runtime: "nodejs12.x",
        memorySize: 256,
        region: "ap-south-1", // <-- change the region as per your setup/requirements
        profile: "profile_name", // <-- select the profile that was set while doing aws configuration
        stackName: "${self:custom.stackName}",
        stage: "${opt:stage, 'v1'}",
        lambdaHashingVersion: "20201221",
        iam: {
            role: {
                statements: [
                    {
                        Effect: 'Allow',
                        Action: ['dynamodb:*'],
                        Resource: "*"
                    }
                ]
            }
        }
    },
    functions: {
        index: {
            handler: "src/handlers/index.handler",
            environment: {
                "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1",
                "APP_ENV": "ANYTHING",
                "SLS_DEBUG": "true",
                "APP_STAGE": "${self:custom.stage}"
            },
            package: {
                exclude: ["node_modules/aws-sdk/**"]
            }
        }
    },
    resources: {
        Outputs: {
            CustomResourcesServiceToken: {
                Description: "The ARN of the custom resources Lambda function to use as a service token when using a custom resource.",
                Value: { 'Fn::GetAtt': [ 'IndexLambdaFunction', 'Arn' ] },
                Export: {
                    Name: '${self:custom.stackName}-ServiceToken'
                }
            }
        }
    }
}

module.exports = serverlessConfiguration;
