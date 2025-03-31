#!/usr/bin/env node
import { CloudFormationClient, ListExportsCommand } from '@aws-sdk/client-cloudformation';
import * as cdk from 'aws-cdk-lib';
import { AdminListenerArnExportName, AwsRegion, NonprodConfig, ProdConfig } from "../config";
import { GeodeticCalculatorAppsStack } from '../lib/geodetic-calculator-apps-stack';


const prodEnv = { account: "595102202322", region: AwsRegion };
const nonprodEnv = { account: "256884736311", region: AwsRegion };

async function getExportedValues(exportNames: string[]): Promise<{ [key: string]: string } | undefined> {

  let cf = new CloudFormationClient({ region: AwsRegion });
  let params = {};
  let values: { [key: string]: string } = {};
  while (true) {
    const command = new ListExportsCommand(params);
    const data = await cf.send(command);
    if (data.Exports) {
      for (let item of data.Exports) {
        if (item.Name === undefined) continue;
        if (exportNames.includes(item.Name) && item.Value !== undefined) {
          values[item.Name] = item.Value
        }
      }
    }
    if (data.NextToken == null) break;
    params = { NextToken: data.NextToken }
  }
  for (let name of exportNames) {
    if (!(name in values)) {
      return undefined;
    }
  }
  return values;
}

async function main(): Promise<void> {

  const app = new cdk.App();

  // NOTE: Need to look up ALB Listener ARN export before building as a Listener
  // cannot be referenced in CloudFormation using a Token (ie imported value).
  // So look it up first and then use actual value to build template with CDK.
  let listenerArns = await getExportedValues([AdminListenerArnExportName]);
  if (listenerArns === undefined) {
    throw `Cannot build stack as exported values for admin listeners are not defined`
  }

  new GeodeticCalculatorAppsStack(app, 'GeodeticCalculatorAppsStackProd', {
    env: prodEnv,
    config: ProdConfig,
    adminListenerArn: listenerArns[AdminListenerArnExportName],
  });

  new GeodeticCalculatorAppsStack(app, 'GeodeticCalculatorAppsStackNonprod', {
    env: nonprodEnv,
    config: NonprodConfig,
    adminListenerArn: listenerArns[AdminListenerArnExportName],
  });

}

main();
