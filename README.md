# linz-geodetic-calculator-apps

Package to install three javascript based calculators onto the geodetic website.  These are old internal facing javascript applications - not displayed on the public website..

The calculators are:

* nzmapconv - a javascript calculator for converting between NZGD2000 and NZGD49 based map references and geodetic coordinates
* projection-correction - converts between a projection and sea level distance for NZGD2000 based cadastral circuit projections
* traverse-calculator - calculates survey traverse miscloses either on a traverse loop or between two known coordinates.  For a closed loop also calculates the area after applying Bowditch correction.

They are deployed using a lambda application load balancer (ALB) target.  The lambda function contains includes the application files which are simply passed back to the ALB listener in response to web request events.

The infrastructure adds the ALB targets to the internal facing load balancer implemented by the [www-geodesy-common-infrastructure](https://github.com/linz/www-geodesy-common-infrastructure) deployment.

## Deployment

Standard CDK manual deployment.

For nonprod:

```sh
 cd infrastructure && npx cdk deploy GeodeticCalculatorAppsStackNonprod
```

For production:

```sh
 cd infrastructure && npx cdk deploy GeodeticCalculatorAppsStackProd
```
