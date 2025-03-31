import { Duration, Stack, StackProps } from "aws-cdk-lib";

import { LambdaTarget } from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";

import { Construct } from 'constructs';
import { Config } from '../config';
import { ApplicationListener, ApplicationTargetGroup, ListenerAction, ListenerCondition, TargetType } from "aws-cdk-lib/aws-elasticloadbalancingv2";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface GeodeticCalculatorAppsProps extends StackProps {
  config: Config;
  adminListenerArn: string;
}

export class GeodeticCalculatorAppsStack extends Stack {
  constructor(scope: Construct, id: string, props: GeodeticCalculatorAppsProps) {
    super(scope, id, props);
    let config = props.config;

    const codesAdminHandler = new Function(this, "CodesAdminHandler", {
      runtime: Runtime.PYTHON_3_12,
      code: Code.fromAsset('../lambda'),
      handler: 'app_pages.handleEvent',
      environment: {
        NZMAPCONV_URL: config.endpoints.urlPath.nzmapconv,
        PROJCORR_URL: config.endpoints.urlPath.projcorr,
        TRAVCALC_URL: config.endpoints.urlPath.travcalc,
      },
      timeout: Duration.seconds(config.endpoints.timeoutSeconds)
    });

    const calculatorsTarget = new LambdaTarget(codesAdminHandler);
    const calculatorsTargetGroup = new ApplicationTargetGroup(this, "CalculatorsTargetGroup", {
      targetType: TargetType.LAMBDA,
      targets: [calculatorsTarget]
    });

    const codesAdminListener = ApplicationListener.fromLookup(this, "CodesAdminListener", {
      listenerArn: props.adminListenerArn,
    });
    codesAdminListener.addAction('CalculatorsTarget', {
      priority: config.endpoints.listenerPriority,
      conditions: [ListenerCondition.pathPatterns([
        `${config.endpoints.urlPath.nzmapconv}/*`,
        `${config.endpoints.urlPath.nzmapconv}`,
      ])],
      action: ListenerAction.forward([calculatorsTargetGroup])
    });
    codesAdminListener.addAction('CalculatorsTarget2', {
      priority: config.endpoints.listenerPriority + 1,
      conditions: [ListenerCondition.pathPatterns([
        `${config.endpoints.urlPath.projcorr}/*`,
        `${config.endpoints.urlPath.projcorr}`,
        `${config.endpoints.urlPath.travcalc}/*`,
        `${config.endpoints.urlPath.travcalc}`,
      ])],
      action: ListenerAction.forward([calculatorsTargetGroup])
    });
  }
}
