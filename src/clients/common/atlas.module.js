angular.module('atlas', [])
	.config([function() {}])
	.run([function() {}])
	/**
	 * @ngdoc provider
	 * @name identClientProvider
	 * @description
	 * Use `identClientProvider` to change the default behavior of the {@link atlas.identClient identClient} service.
	 */
	.provider('identClient', [function() {
		var theProvider = {
			$get: ['$http', function($http) {
				/**
				 * @ngdoc method
				 * @name identClient#createAccount
				 * @description 
				 * Creates a new account.
				 *
				 * @param {Object=} account The account data object. The object has these properties:
				 *   **TODO**
				 * @param {Object} config The [$http](https://docs.angularjs.org/api/ng/service/$http) configuration object
				 *
				 * @returns {HttpPromise} Returns a [promise](https://docs.angularjs.org/api/ng/service/$q) object with the
				 *   standard `then` method and two http specific methods: `success` and `error`. The arguments passed into 
				 *   these functions are destructured representation of the response object passed into the `then` method. The 
				 *   response object has these properties:
				 *   - **data** – `{string|Object}` – The response body transformed with the transform functions.
				 *   - **status** – `{number}` – HTTP status code of the response.
				 *   - **headers** – `{function([headerName])}` – Header getter function.
				 *   - **config** – `{Object}` – The configuration object that was used to generate the request.
				 *   - **statusText** – `{string}` – HTTP status text of the response.
				 */
				var createAccount = function(account, config) {
					console.log(account, config);
					return $http(extend(config || {}, {
						method: 'post',
						url: '',
						data: account
					}));
				};
				/**
				 * @ngdoc service
				 * @name identClient
				 *
				 * @description
				 * The `identClient` service is a client for the atlas 
				 * [Identity service](http://ia2.azurewebsites.net/#/documentation-identityServer)
				 * resources.
				 */
				var theService =  {
					createAccount: createAccount
				};
				return theService;
			}]
		};
		return theProvider;
	}])
	/**
	 * @ngdoc provider
	 * @name orgModelClientProvider
	 * @description
	 * Use `orgModelClientProvider` to change the default behavior of the {@link atlas.orgModelClient orgModelClient} service.
	 */
	.provider('orgModelClient', [function() {
		var theProvider = {
			$get: ['$http', function($http) {
				/**
				 * @ngdoc method
				 * @name orgModelClient#createUser
				 * @description 
				 * Creates a new user resource.
				 *
				 * @param {Object=} user The user data object. The object has these properties:
				 *   **TODO**
				 * @param {Object} config The [$http](https://docs.angularjs.org/api/ng/service/$http) configuration object
				 *
				 * @returns {HttpPromise} Returns a [promise](https://docs.angularjs.org/api/ng/service/$q) object with the
				 *   standard `then` method and two http specific methods: `success` and `error`. The arguments passed into 
				 *   these functions are destructured representation of the response object passed into the `then` method. The 
				 *   response object has these properties:
				 *   - **data** – `{string|Object}` – The response body transformed with the transform functions.
				 *   - **status** – `{number}` – HTTP status code of the response.
				 *   - **headers** – `{function([headerName])}` – Header getter function.
				 *   - **config** – `{Object}` – The configuration object that was used to generate the request.
				 *   - **statusText** – `{string}` – HTTP status text of the response.
				 */
				var createUser = function(user, config) {
					console.log(user, config);
					return $http.get('/someUrl');
				};
				/**
				 * @ngdoc service
				 * @name orgModelClient
				 *
				 * @description
				 * The `orgModelClient` service is a client for the atlas 
				 * [Organizational Model service](http://ia2.azurewebsites.net/#/documentation-orgmodelService)
				 * resources.
				 */
				var theService = {
					createUser: createUser
				};
				return theService;
			}]
		};
		return theProvider;
	}])
	/**
	 * @ngdoc provider
	 * @name accountClientProvider
	 * @description
	 * Use `accountClientProvider` to change the default behavior of the {@link atlas.accountClient accountClient} service.
	 */
	.provider('accountClient', [function() {
		var identProviderConfig = null;
		var orgModelProviderConfig = null;
		
		return {
			/**
			 * @ngdoc method
			 * @name accountClientProvider#identClientConfig
			 * @description 
			 * Default configuration for all identity API client calls.
			 *
			 * @returns {boolean|Object} If a value is specified, returns the accountClientProvider for chaining.
			 *    otherwise, returns the current configured value.
			 */
			identClientConfig: function(value) {
				if (arguments.length) {
					identProviderConfig = value;
					return this;
				}
				else {
					return identProviderConfig;
				}
			},
			/**
			 * @ngdoc method
			 * @name accountClientProvider#orgModelClientConfig
			 * @description 
			 * Default configuration for all orgModel API client calls.
			 *
			 * @returns {boolean|Object} If a value is specified, returns the accountClientProvider for chaining.
			 *    otherwise, returns the current configured value.
			 */
			orgModelClientConfig: function(value) {
				if (arguments.length) {
					orgModelProviderConfig = value;
					return this;
				}
				else {
					return orgModelProviderConfig;
				}
			},
			/**
			 * @ngdoc service
			 * @name accountClient
			 * @requires identClient
			 * @requires orgModelClient
			 *
			 * @description
			 * The `accountClient` service is a composite Atlas service that implements 
			 * [the steps required](http://ia2.azurewebsites.net/#/examples-isCreateAccess) 
			 * for a new user to get access to atlas APIs.
			 */
			$get: ['identClient', 'orgModelClient', function(identClient, orgModelClient) {
				var identServiceConfig = null,
					orgModelServiceConfig = null;
				/**
				 * @ngdoc method
				 * @name accountClient#getIdentConfig
				 * @description 
				 * Returns the service-scoped configuration object for the Identity Service API calls.
				 *
				 * @returns {Object} The [$http](https://docs.angularjs.org/api/ng/service/$http) configuration object
				 */
				var getIdentConfig = function() {
					return identServiceConfig;
				};
				/**
				 * @ngdoc method
				 * @name accountClient#setIdentConfig
				 * @description 
				 * Sets the service-scoped configuration object for the Identity Service API calls.
				 *
				 * @param {Object} value The [$http](https://docs.angularjs.org/api/ng/service/$http) configuration object
				 * @returns {Object} Returns the accountClient service for chaining.
				 */
				var setIdentConfig = function(value) {
					identServiceConfig = value;
					return this;
				};
				/**
				 * @ngdoc method
				 * @name accountClient#getOrgModelConfig
				 * @description 
				 * Returns the service-scoped configuration object for the Organization Model Service API calls.
				 *
				 * @returns {Object} The [$http](https://docs.angularjs.org/api/ng/service/$http) configuration object
				 */
				var getOrgModelConfig = function() {
					return orgModelServiceConfig;
				};
				/**
				 * @ngdoc method
				 * @name accountClient#setOrgModelConfig
				 * @description 
				 * Sets the service-scoped configuration object for the Organization Model Service API calls.
				 *
				 * @param {Object} value The [$http](https://docs.angularjs.org/api/ng/service/$http) configuration object
				 * @returns {Object} Returns the accountClient service for chaining.
				 */
				var setOrgModelConfig = function(value) {
					orgModelServiceConfig = value;
					return this;
				};
				/**
				 * @ngdoc method
				 * @name accountClient#create
				 * @description 
				 * Create a user resource in org model API and the respective account in the identity API.
				 *
				 * ```js
				 * service.create({username: 'jane', email: 'jane@example.com'}, 'secret').then(fn1, fn2);
				 * ```
				 *
				 * @param {Object=} user The user information to create. It has the following properties:
				 *   - **username** – `{string}` – (default: null) The username
				 *   - **firstname** – `{string}` – (default: null) The firstname
				 *   - **lastname** – `{string}` – (default: null) The lastname
				 *   - **email** – `{string}` – (default: null) The email
				 *   - **company** – `{string}` – (default: null) The company
				 * @param {string=} password The password of the account
				 * @param {Object} identConfig 
				 * @param {Object} orgModelConfig 
				 */
				var create = function(user, password, identConfig, orgModelConfig) {
					var account = {
						userName: user.username,
						password: password,
						email: user.email,
					};
					var identConfig = identConfig || identServiceConfig || identProviderConfig;
					return identClient.createAccount(account, identConfig)
						.then(function(account) {
							var user = {
								Id: account.Id,
								Username: user.username,
								Firstname: user.firstname,
								Lastname: user.lastname,
								Email: user.email
							};
							var config = orgModelConfig || orgModelServiceConfig || orgModelProviderConfig;
							return orgModelClient.createUser(user, config);
						});
				};
				var theService = {
					create: create,
					getIdentConfig: getIdentConfig,
					setIdentConfig: setIdentConfig,
					getOrgModelConfig: getOrgModelConfig,
					setOrgModelConfig: setOrgModelConfig,
				};
				return theService;
			}],
		}
		
	}])
	.factory('caseClient', [function() {}])
	.factory('taskClient', [function() {}])
	.factory('cmsClient', [function() {}])
	.factory('templateClient', [function() {}])
	.factory('ruleClient', [function() {}])
	.factory('businessClient', [function() {}])
	; 