deploy-nonprod:
	cd infrastructure && npx cdk deploy GeodeticCalculatorAppsStackNonprod

deploy-prod:
	cd infrastructure && npx cdk deploy GeodeticCalculatorAppsStackProd