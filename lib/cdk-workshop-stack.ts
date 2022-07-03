import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { HitCounter } from './hitcounter';
import { Ec2Action } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { App, CfnOutput, RemovalPolicy, Token } from 'aws-cdk-lib';

//import { TableViewer} from 'cdk-dynamo-table-viewer';

export class CdkWorkshopStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs:2,
      natGateways:0,
      subnetConfiguration: [{
        name: 'PublicSubnet',
        subnetType:ec2.SubnetType.PUBLIC
      }]
    })

    //keypair
    const cfnKeyPair = new ec2.CfnKeyPair(this, 'cfnKeyPair', {
      keyName: 'test-key-pair'
    })
    cfnKeyPair.applyRemovalPolicy(RemovalPolicy.DESTROY); //whats this?

    // キーペア取得コマンドアウトプット
    new CfnOutput(this, 'GetSSHKeyCommand', {
      value: `aws ssm get-parameter --name /ec2/keypair/${cfnKeyPair.getAtt('KeyPairId')} --region ${this.region} --with-decryption --query Parameter.Value --output text`,
    });

    //ec2作成
    const instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType:ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: Token.asString(cfnKeyPair.ref),
    })
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(22))


    // // defines an AWS Lambda resource
    // const hello = new lambda.Function(this, 'HelloHandler', {
    //   runtime : lambda.Runtime.NODEJS_14_X,
    //   code : lambda.Code.fromAsset('lambda'), //相対pass
    //   handler: 'hello.handler'
    // });

    // const hellowithCounter = new HitCounter(this, 'HelloHitCounter', {
    //   downstream:hello
    // });

    // // defines an API Gateway REST API resource backed by our "hello" function.
    // new apigw.LambdaRestApi(this, 'Endpoint' , {
    //   //handler : hello
    //   handler:  hellowithCounter.handler
    // });

    //テーブルの公開をパブリック
    // new TableViewer(this, 'ViewHitCounter', {
    //   title: 'Hello Hits' ,
    //   table: hellowithCounter.table
    // });

  }
}
