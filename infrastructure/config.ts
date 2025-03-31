export const AwsRegion = "ap-southeast-2";

export enum Environment {
  PROD = "prod",
  NON_PROD = "nonprod",
};

// Maximum run time for endpoint lambda functions

const LambdaTimeoutSeconds = 10;

// Exported name of public and internal facing ALB listener

export const AdminListenerArnExportName = "GeodesyWwwAdminListenerArn";

// Arbitrary low valued (numerically high) priority - must differ from any other...

const ListenerPriority = 43190;

const UrlPaths = {
  nzmapconv: "/nzmapconv",
  projcorr: "/projection-correction",
  travcalc: "/traverse-calculator",
}

export interface Config {
  name: string;
  endpoints: {
    hostedZone: string;
    listenerPriority: number;
    timeoutSeconds: number;
    urlPath: {
      nzmapconv: string;
      projcorr: string;
      travcalc: string;
    };
  }
};

export const ProdConfig: Config = {
  name: Environment.PROD,
  endpoints: {
    hostedZone: `${Environment.PROD}.geodesy.awsint.linz.govt.nz`,
    listenerPriority: ListenerPriority,
    timeoutSeconds: LambdaTimeoutSeconds,
    urlPath: UrlPaths,
  }
};

export const NonprodConfig: Config = {
  name: Environment.NON_PROD,
  endpoints: {
    hostedZone: `${Environment.NON_PROD}.geodesy.awsint.linz.govt.nz`,
    listenerPriority: ListenerPriority,
    timeoutSeconds: LambdaTimeoutSeconds,
    urlPath: UrlPaths,
  }
};
