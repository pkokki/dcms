angular.module('studio', [
		'ui.router',
		'ngMaterial',
		'ngMessages',
		'atlas',
		'titan',
	])
	.config(['$stateProvider', '$urlRouterProvider', '$mdIconProvider', function ($stateProvider, $urlRouterProvider, $mdIconProvider) {

		$mdIconProvider.iconSet('core', '../assets/img/core-icons.svg', 24);

		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				templateUrl: 'home.html',
				controller: 'homeController',
				allowAnonymous: true
			})
			.state('register', {
				url: '/register',
				templateUrl: 'register.html',
				controller: 'registerController',
				allowAnonymous: true
			})
			.state('registerThanks', {
				url: '/registerThanks',
				template: '<h1>Thank you!</h1><p>You will receive a message with further info after registration approval.</p><p><a href="#/home">Home</a></p>',
				allowAnonymous: true
			})
			.state('signin', {
				url: '/signin',
				templateUrl: 'signin.html',
				controller: 'signinController',
				allowAnonymous: true
			})
			.state('forgotPassword', {
				url: '/forgotPassword',
				templateUrl: 'forgotPassword.html',
				controller: 'forgotPasswordController',
				allowAnonymous: true
			})
			.state('dashboard', {
				url: '/dashboard',
				templateUrl: 'dashboard.html',
				controller: 'dashboardController'
			})
			.state('userProfile', {
				url: '/userProfile',
				templateUrl: 'userProfile.html',
				controller: 'userProfileController'
			})
			.state('newUser', {
				url: '/newUser',
				templateUrl: 'newUser.html',
				controller: 'newUserController'
			})
			.state('settings', {
				url: '/settings',
				templateUrl: 'settings.html',
				controller: 'settingsController'
			})
			.state('settings.operations', {
				url: '/operations',
				templateUrl: 'settings.operations.html',
				//controller: 'settingsController'
			})
			.state('settings.transactions', {
				url: '/transactions',
				templateUrl: 'settings.transactions.html',
				//controller: 'settingsController'
			})
			.state('settings.method', {
				url: '/method',
				templateUrl: 'settings.method.html',
				//controller: 'settingsController'
			})
			.state('buckets', {
				url: '/buckets',
				templateUrl: 'buckets.html',
				controller: 'bucketsController'
			})
			.state('bucketEditor', {
				url: '/buckets/:id',
				templateUrl: 'bucketEditor.html',
				controller: 'bucketEditorController'
			})
			.state('scoringParts', {
				url: '/scoringParts',
				templateUrl: 'scoringParts.html',
				controller: 'scoringPartsController'
			})
			.state('scoringPartEditor', {
				url: '/scoringParts/:id',
				templateUrl: 'scoringPartEditor.html',
				controller: 'scoringPartEditorController'
			})
			.state('scorers', {
				url: '/scorers',
				templateUrl: 'scorers.html',
				controller: 'scorersController'
			})
			.state('scorerEditor', {
				url: '/scorers/:id',
				templateUrl: 'scorerEditor.html',
				controller: 'scorerEditorController'
			})
			.state('letterPlans', {
				url: '/letterPlans',
				templateUrl: 'letterPlans.html',
				controller: 'letterPlansController'
			})
			.state('letterPlanEditor', {
				url: '/letterPlans/:id',
				templateUrl: 'letterPlanEditor.html',
				controller: 'letterPlanEditorController'
			})
			.state('letterTemplates', {
				url: '/letterTemplates',
				templateUrl: 'letterTemplates.html',
				controller: 'letterTemplatesController'
			})
			.state('letterTemplateEditor', {
				url: '/letterTemplates/:id',
				templateUrl: 'letterTemplateEditor.html',
				controller: 'letterTemplateEditorController'
			})
			.state('jobTasks', {
				url: '/jobTasks',
				templateUrl: 'jobTasks.html',
			})
			.state('jobTasks.types', {
				url: '/types',
				templateUrl: 'jobTasks.types.html',
				controller: 'jobTasksTypesController'
			})
			.state('jobTasks.typeEditor', {
				url: '/types/:id',
				templateUrl: 'jobTasks.typeEditor.html',
				controller: 'jobTasksTypeEditorController'
			})
			.state('jobTasks.run', {
				url: '/run',
				templateUrl: 'jobTasks.run.html',
				controller: 'jobTasksRunController'
			})
			.state('targetGroups', {
				url: '/targetGroups',
				templateUrl: 'targetGroups.html',
				controller: 'targetGroupsController'
			})
			.state('targetGroupEditor', {
				url: '/targetGroups/:id',
				templateUrl: 'targetGroupEditor.html',
				controller: 'targetGroupEditorController'
			})
			.state('strategies', {
				url: '/strategies',
				templateUrl: 'strategies.html',
				controller: 'strategiesController'
			})
			.state('strategyEditor', {
				url: '/strategies/:id',
				templateUrl: 'strategyEditor.html',
				controller: 'strategyEditorController'
			})
			.state('strategyDesigner', {
				url: '/strategies/:id/designer',
				templateUrl: 'strategyDesigner.html',
				controller: 'strategyDesignerController'
			})
			.state('campaigns', {
				url: '/campaigns',
				templateUrl: 'campaigns.html',
			})
		;
	}])
	.run(['$rootScope', '$state', 'spa', function ($rootScope, $state, spa) {
		$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
			if (!spa.isSignedOn() && toState.name != 'signin' && !toState.allowAnonymous) {
				spa.suspendRoute(toState, toParams);
				$state.go('signin');
				event.preventDefault();
			}
		});
	}])
	/************************************************************************
	 ****************************** SERVICES ********************************
	 ************************************************************************/

	.factory('spa', ['$state', function($state) {
		var toRoute = null;
		var tenant = null;
		return {
			suspendRoute: function(toState, toParams) {
				toRoute = {
					state: toState,
					params: toParams
				};
			},
			resumeRoute: function() {
				if (toRoute) {
					$state.go(toRoute.state, toRoute.params);
					toRoute = null;
				}
				else {
					$state.go('dashboard');
				}
			},
			setTenant: function(data) {
				tenant = data;
			},
			isSignedOn: function() {
				// #DEV_ONLY
				if (tenant == null) tenant = { id: 1, username: 'relational', firstname: 'Panos', lastname: 'Kokkinidis', company: 'Relational SA', email: 'relational@example.com', active: true, admin: true };
				return tenant != null;
			},
		};
	}])

	.factory('tenantSigninService', ['$q', 'tenantService', function($q, tenantService) {
		var theService = {
			signin: function(credentials) {
				return $q(function(resolve, reject) {
					if (credentials && credentials.email && credentials.password) {
						tenantService.getTenant(credentials.email).then(function(tenant) {
							if (tenant)
								resolve(tenant);
							else
								reject('tenant not found');
						}, function(data) {
							reject('error getting tenant');
						});
					}
					else {
						reject('invalid credentials');
					}
				});
			},
		};
		return theService;
	}])

	.factory('dcmsData', ['$q', function($q) {
		var data = {
			customers: [
				{ id: 1, accounts: [{ id: 1, billTo: [ { id:1 } ] }] }
			],
			delinquencies: [{
				id: 1,
				customerId: 1, accountId: 1, billToId: 1,
				scheduledPayments: [
					{ id: 1, dueDate: '2015-03-01T00:00:00', dueAmount: 200 },
					{ id: 2, dueDate: '2015-02-01T00:00:00', dueAmount: 800 },
				],
				status: 'DELINQUENT', creationDate: '2015-04-24T00:00:00',
				totalAmountDue: 1000,
				agingBucketId: null, agingBucketLineId: null
			}],
			agingBuckets: [{
				id: 1,
				name: 'Bucket #1',
				description: 'The description of the bucket number one.',
				enabled: true,
				lines: [
					{ seq: 1, daysFrom: null, daysTo: 0, type: 'Current', heading: 'Current' },
					{ seq: 2, daysFrom: 1, daysTo: 53, type: 'PastDue', heading: '1-53 days past' },
					{ seq: 3, daysFrom: 54, daysTo: 60, type: 'PastDue', heading: '54-60 days past' },
					{ seq: 4, daysFrom: 61, daysTo: null, type: 'PastDue', heading: '61+ days past' },
				]
			}, {
				id: 2,
				name: 'Bucket #2',
				description: 'The description of the bucket.',
				enabled: false,
			}],
			scoringParts: [
				{ id: 1, name:'delinquencies amount', description: 'total delinquencies amount for account', enabled: true, userDefined: false, type: 'rule', value: null },
				{ id: 2, name:'customer since', description: 'time span in years', enabled: false, userDefined: false, type: 'resx', value: null },
				{ id: 3, name:'number of delinquencies', description: 'count of records', enabled: true, userDefined: false, type: 'expr', value: null },
				{ id: 4, name:'due date is greater than today', description: '', enabled: true, userDefined: false, type: 'expr', value: '@.dueDate > $.today' },
			],
			scorers: [
				{
					id: 1001, name:'Customer Scorer',
					description: 'Scores the party (customer). Displays the score in the Collections Score field in the Collections Header.',
					enabled: true, userDefined: false,
					level: 'Customer', segment: 'Delinquent Parties Filter',
					minScore: 0, maxScore: 100, weightRequired: true,
					parts: []
				},
				{
					id: 1002, name:'Account Scorer',
					description: 'Scores the account. Displays the score in the Score field on the Accounts tab.',
					enabled: true, userDefined: false,
					level: 'Account', segment: 'Accounts Filter',
					minScore: 0, maxScore: 100, weightRequired: true,
					parts: []
				},
				{
					id: 1003, name:'Bill To Scorer',
					description: 'Scores the Bill To sites.',
					enabled: true, userDefined: false,
					level: 'BillTo', segment: 'Delinquent Bill Site To Filter',
					minScore: 0, maxScore: 100, weightRequired: true,
					parts: []
				},
				{
					id: 1004, name:'Delinquency Status Determination',
					description: 'Scores transactions to determine status of current or delinquent.',
					enabled: true, userDefined: false,
					level: 'Transactions', segment: 'Invoice Delinquency Filter',
					minScore: 0, maxScore: 100, weightRequired: false,
					parts: [ { id: 4, name: 'due date is greater than today' }]
				},
				{ id: 1, name:'custom scorer with two parts', description: 'a scorer ', enabled: true, userDefined: true,
				  level: 'BillTo', minScore: 0, maxScore: 100, weightRequired: true,
				  parts: [{ id: 1, name:'delinquencies amount', weight: 70 }, { id: 3, name:'number of delinquencies', weight: 30 }] },
			],
			letterPlans: [
				{ id: 1, name: 'plan #1', description: 'plan #1 description', level: 'Account', enabled: true, scorerId: 1, bucketId: 1 },
				{ id: 2, name: 'plan #2', description: null, level: 'BillTo', enabled: true, scorerId: 1, bucketId: 1,
					scorerParts: [{id: 1, name: "delinquencies amount", weight: 100}, {id: 3, name: "number of delinquencies", weight: 0}],
					planLines: [
						{bucketLine: {id:1, heading: "1-53 days past"}, scoreLow: 0, scoreHigh: 60, method: "Email", template:{id: 2, name: "tx2"}},
						{bucketLine: {id:1, heading: "1-53 days past"}, scoreLow: 61, scoreHigh: 100, method: "Email", template:{id: 2, name: "tx2"}, callback: { enabled:true, days:5}},
					]
				},
			],
			letterTemplates: [
				{
					id: 1, code:'TMPL001', name: 'template #1', description: 'a description for template #1',
					enabled: true, startDate: '2015-04-30T21:00:00.000Z', endDate: '2015-05-30T21:00:00.000Z',
					files: [
						{ filename: 'TMPL001.docx', language: 'en' }
					]
				},
			],
			jobTasksTypes: /* CaseSpecifications with Code like #DC___ */[
				{
					Id: 101, Code: '#DC01', Name: 'Scoring Engine',
					Description: 'Scores and creates delinquencies, and scores customers, accounts, or bill-to locations. Can have up to four scorers to the job instance.', Definition: {
					Properties: {
						Scorer1: { DataType: 'int' },
						Scorer2: { DataType: 'int' },
						Scorer3: { DataType: 'int' },
						Scorer4: { DataType: 'int' },
					},
					InMappings: [
						{ Source: 'arguments.Scorer1', Target: 'container.Properties.Scorer1' },
						{ Source: 'arguments.Scorer2', Target: 'container.Properties.Scorer2' },
						{ Source: 'arguments.Scorer3', Target: 'container.Properties.Scorer3' },
						{ Source: 'arguments.Scorer4', Target: 'container.Properties.Scorer4' },
					],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'ScoringEngine', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 102, Code: '#DC02', Name: 'Promise Reconciliation',
					Description: 'Verifies if payments were posted for invoices with promises; creates broken promise items for universal task list.', Definition: {
					Properties: {},
					InMappings: [],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'PromiseReconciliation', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 103, Code: '#DC03', Name: 'Send Letters for Delinquent Customers',
					Description: 'Compares the score of the object with the active letter plan and sends the letters for all appropriate delinquent customers.', Definition: {
					Properties: {
						PlanId: { DataType: 'int' },
						FromDate: { DataType: 'date' },
						Preliminary: { DataType: 'boolean' },
					},
					InMappings: [
						{ Source: 'arguments.PlanId', Target: 'container.Properties.PlanId' },
						{ Source: 'arguments.FromDate', Target: 'container.Properties.FromDate' },
						{ Source: 'arguments.Preliminary', Target: 'container.Properties.Preliminary' },
					],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'SendLettersForDelinquentCustomers', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 104, Code: '#DC04', Name: 'Broken Promise Callbacks',
					Description: 'Reviews the letter plan and creates all necessary callback tasks for delinquent customers.', Definition: {
					Properties: {},
					InMappings: [],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'BrokenPromiseCallbacks', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 105, Code: '#DC05', Name: 'Collection Strategy Workflow',
					Description: 'Initiates the execution of assigned strategies and continues monitoring strategies in progress.', Definition: {
					Properties: {},
					InMappings: [],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'CollectionStrategyWorkflow', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 106, Code: '#DC06', Name: 'Strategy Fulfillment Mailer',
					Description: 'Executes automated correspondence work items for strategies.', Definition: {
					Properties: {},
					InMappings: [],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'StrategyFulfillmentMailer', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 107, Code: '#DC07', Name: 'Strategy Management',
					Description: 'Compares the object`s score with available strategies` ranks and assign appropriate strategies. It also creates work items in active strategies.', Definition: {
					Properties: {},
					InMappings: [],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'StrategyManagement', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 201, Code: '#DC08', Name: 'Populate universal task summaries',
					Description: 'Updates delinquent customer data in the Collector`s Work Queue.', Definition: {
					Properties: {
						FromDate: { DataType: 'date', Description: 'Leave the parameter blank to run the program in total refresh mode or enter the date the program last ran for incremental mode.' },
					},
					InMappings: [
						{ Source: 'arguments.FromDate', Target: 'container.Properties.FromDate' },
					],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'PopulateUniversalTaskSummaries', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 202, Code: '#DC09', Name: 'Clear Delinquency Buffers',
					Description: 'Clears the buffer tables used in scoring. Run it only if the scoring job stops before completing.', Definition: {
					Properties: {},
					InMappings: [],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'ClearDelinquencyBuffers', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
				{
					Id: 203, Code: '#DC10', Name: 'Purge Score History',
					Description: 'Run this after scoring if you do not want to save historical scoring data.', Definition: {
					Properties: {},
					InMappings: [],
					Nodes: {
						N1: { Type: 'StartEvent' },
						N2: { Type: 'CodeActivity', Parameters: { Operation: 'ClearDelinquencyBuffers', Arguments: 'container.Properties' } },
						N3: { Type: 'EndEvent' },
					},
					Transitions: [
						{ Source: 'N1', Target: 'N2' },
						{ Source: 'N2', Target: 'N3' },
					]
				}},
			],
			jobTasks: [],
			targetGroups: [
				{
					id: 1,
					name: 'default parties',
					description: 'all party resources',
					enabled: true,
					bs: {
						endpoint: 'http://atlasV5.azurewebsites.net/business/api/',
						security: {
							type: 'oauth2',
							oauth2: {
								uri: 'http://atlasV5.azurewebsites.net/id/api/',
								username: 'DCMS_OPERATOR',
								password: 'DCMS_OPERATOR'
							}
						},
						resourceName: 'Party',
						queryName: null,
						viewName: null
					}
				},
			],
			strategies: [
				{id: 1, name: 'default strategy', description: 'The default strategy description', enabled: true}
			],
		};
		var traverseForArray = function(target, name) {
			var obj = target[name];
			if (angular.isArray(obj)) {
				return obj;
			}
			else {
				for (var p in target) {
					if (angular.isArray(target[p]))
					{
						var child = traverseForArray(target[p], name);
						if (child) {
							return child;
						}
					}
				}
				return null;
			}
		};
		var theService = {
			getEntities: function(type) {
				return $q(function(resolve, reject) {
					var entities = traverseForArray(data, type);
					if (entities)
						resolve(JSON.parse(JSON.stringify(entities)));
					else
						reject('Entity type "' + type + '" not found.')
				});
			},
			getEntity: function(type, id, key) {
				return $q(function(resolve, reject) {
					key = key || 'id';
					var entities = traverseForArray(data, type);
					if (entities) {
						var found = null;
						for (var i = 0; i < entities.length; i++) {
							var entity = entities[i];
							if (entity && entity[key] == id) {
								found = entity;
								break;
							}
						}
						resolve(JSON.parse(JSON.stringify(found)));
					}
					else {
						reject('Entity type "' + type + '" not found.');
					}
				});
			},
			createEntity: function(type, entity, key) {
				return $q(function(resolve, reject) {
					key = key || 'id';
					var entities = traverseForArray(data, type);
					if (entities) {
						var max = 0;
						for (var i = 0; i < entities.length; i++) {
							max = Math.max(max, entities[i][key]);
						}
						var newObj = {};
						newObj[key] = max + 1;
						var input = JSON.parse(JSON.stringify(entity));
						delete input[key];
						angular.extend(newObj, input);
						entities.push(newObj);
						resolve(JSON.parse(JSON.stringify(newObj)));
					}
					else {
						reject('Entity type "' + type + '" not found.');
					}
				});
			},
			updateEntity: function(type, entity, key) {
				return $q(function(resolve, reject) {
					key = key || 'id';
					if (entity && entity[key]) {
						var entities = traverseForArray(data, type);
						if (entities) {
							var found = null;
							for (var i = 0; i < entities.length; i++) {
								if(entities[i][key] == entity[key]) {
									found = entities[i];
									break;
								}
							}
							if (found) {
								var input = JSON.parse(JSON.stringify(entity));
								angular.extend(found, input);
								resolve(JSON.parse(JSON.stringify(found)));
							}
							else {
								reject('Entity with key "' + entity[key] + '" and type "'
									+ type + '" not exists.');
							}
						}
						else {
							reject('Entity type "' + type + '" not found.');
						}
					}
					else {
						reject('Entity is null or has no key.');
					}
				});
			},
			deleteEntity: function(type, id, key) {
				return $q(function(resolve, reject) {
					key = key || 'id';
					var entities = traverseForArray(data, type);
					if (entities) {
						var target = null;
						for (var i = 0; i < entities.length; i++) {
							var entity = entities[i];
							if (entity && entity[key] == id) {
								entities.splice(i, 1);
								target = entity;
								break;
							}
						}
						resolve(JSON.parse(JSON.stringify(target)));
					}
					else {
						reject('Entity type "' + type + '" not found.');
					}
				});
			},
		};
		return theService;
	}])
	.factory('settings', [function() {
		var settings = {
			operations: {
				/* general */
				defaultLevel: 'BillTo', /* Customer, Account, BillTo, Delinquency */
				levelCustomer: true,
				levelAccount: false,
				levelBillTo: true,
				levelDelinquency: false,
				/* display */
				reviewDisplaySettings: true,
				/* correspondence */
				sendCorrespondence: true,
			},
			transactions: {
				transactions: {},
				metrics: {},
			},
			method: {
				type: 'DunningPlan', /* DunningPlan | Strategies */
				scoringComponents: [{
					name: 'var1',
					type: 'BillTo',
					description: 'How many delinquencies does this customer have?',
					enabled: true,
					foundation: true,
					valueType: 'Expression', /* Expression | Rule | Business */
				}, {
					name: 'var2',
					type: 'BillTo',
					description: 'How long have I been doing business with this customer?',
					enabled: true,
					foundation: true,
					valueType: 'Expression', /* Expression | Rule | Business */
				}],
				scoringEngines: [],
				dunningPlans: [],
			}
		};
		return settings;
	}])
	/************************************************************************
	 **************************** DIRECTIVES ********************************
	 ************************************************************************/
	.directive('formatDate', [function(){
		return {
			require: 'ngModel',
			link: function(scope, elem, attr, modelCtrl) {
				modelCtrl.$formatters.push(function(modelValue){
					if (modelValue)
						return new Date(modelValue);
					else
						return null;
				})
			}
		}
	}])
	/************************************************************************
	 **************************** CONTROLLERS *******************************
	 ************************************************************************/
	.controller('appController', ['$scope', '$mdSidenav', '$state', 'spa', function($scope, $mdSidenav, $state, spa) {
		$scope.goHome = function() {
			$state.go('dashboard');
		};
		$scope.hasUser = spa.isSignedOn;

		$scope.goUserProfile = function() {
			$state.go('userProfile');
		};
		$scope.toggleMenu = function(id) {
			$mdSidenav(id).toggle();
		};
		console.info('Studio started');
	}])
	.controller('homeController', [function() {}])
	.controller('registerController', ['$scope', '$state', 'tenantService', function($scope, $state, tenantService) {
		$scope.register = function(tenantData) {
			tenantService.registerTenant(tenantData)
				.then(function(data) {
					$state.go('registerThanks');
				}, function(data) {
					$scope.errorMsg = data;
				});
		};
		$scope.registerWithGoogle = function() {
			console.warn('registerController.registerWithGoogle: Not implemented!');
		};
	}])
	.controller('signinController', ['$scope', '$state', 'spa', 'tenantSigninService', function($scope, $state, spa, tenantSigninService) {
		$scope.signin = function(credentials) {
			tenantSigninService.signin(credentials).then(function(tenant) {
				spa.setTenant(tenant);
				spa.resumeRoute();
			}, function(data) {
				$scope.errorMsg = data;
			});
		};
		$scope.googleSignin = function() {
			console.warn('signinController.googleSignin: Not implemented!');
		};
	}])
	.controller('forgotPasswordController', [function() {}])
	.controller('dashboardController', [function() {}])
	.controller('userProfileController', [function() {}])
	.controller('newUserController', ['$scope', function($scope) {
		$scope.data = {
			username: null,
			password: null,
			firstname: null,
			lastname: null,
			company: null,
			email: null,
		};
	}])
	.controller('settingsController', ['$scope', 'settings', function($scope, settings) {
		$scope.settings = settings;
	}])
	.controller('bucketsController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		var refresh = function() {
			dcmsData.getEntities('agingBuckets').then(function(entities) {
				$scope.entities = entities;
			});
		};

		$scope.delete = function(data) {
			if (entity) {
				var selectedId = null;
				if (entity.id) {
					selectedId = entity.id;
				}
				else if (angular.isNumber(entity) || angular.isString(entity)) {
					selectedId = entity;
				}
				if (selectedId) {
					dcmsData.deleteEntity('agingBuckets', selectedId).then(function(entity) {
						refresh();
					});
				}
			}
		}

		refresh();
	}])
	.controller('bucketEditorController', ['$scope', '$state', '$stateParams', '$mdDialog', 'dcmsData', function($scope, $state, $stateParams, $mdDialog, dcmsData) {
		var id = $stateParams.id;
		if (id == 'new') {
			$scope.formData = { id: null };
		}
		else {
			dcmsData.getEntity('agingBuckets', id).then(function(entity) {
				$scope.formData = entity;
			});
		}

		var finish = function() {
			$scope.formData = null;
			$state.go('buckets');
		};
		$scope.cancel = function() {
			finish();
		}
		$scope.save = function() {
			var data = $scope.formData;
			if (data) {
				var next = function(entity) {
					finish();
				};
				if (data.id) {
					dcmsData.updateEntity('agingBuckets', data).then(next);
				}
				else {
					dcmsData.createEntity('agingBuckets', data).then(next);
				}
			}
		};

		var showLineDialog = function(ev, data) {
			return $mdDialog.show({
				controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {
					$scope.data = data;
					$scope.cancel = function() {
						$mdDialog.cancel();
					}
					$scope.save = function(data) {
						$mdDialog.hide(data);
					}
				}],
				templateUrl: 'bucketLineDialog.html',
				targetEvent: ev,
			});
		};

		$scope.addLine = function(ev) {
			var data = { type: 'PastDue' };
			showLineDialog(ev, data).then(function(line) {
				if (!$scope.formData.lines)
					$scope.formData.lines = [];
				line.seq = $scope.formData.lines.length + 1;
				$scope.formData.lines.push(line);
			});
		};
		$scope.editLine = function(ev, index) {
			var original = $scope.formData.lines[index];
			var copy = JSON.parse(JSON.stringify(original));
			showLineDialog(ev, copy).then(function(line) {
				$scope.formData.lines[index] = line;
			});
		};
		$scope.deleteLine = function(index) {
			var lines = $scope.formData.lines;
			lines.splice(index, 1);
			for (var i = index; i < lines.length; i++)
				--lines[i].seq;
		};
	}])
	.controller('scoringPartsController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		dcmsData.getEntities('scoringParts').then(function(entities) {
			$scope.entities = entities;
		});
	}])
	.controller('scoringPartEditorController', ['$scope', '$state', '$stateParams', 'dcmsData', function($scope, $state, $stateParams, dcmsData) {
		var id = $stateParams.id;
		if (id == 'new') {
			$scope.formData = { id: null, userDefined: true, type: 'rule' };
		}
		else {
			dcmsData.getEntity('scoringParts', id).then(function(entity) {
				$scope.formData = entity;
			});
		}

		var finish = function() {
			$scope.formData = null;
			$state.go('scoringParts');
		};
		$scope.cancel = function() {
			finish();
		}
		$scope.save = function() {
			var data = $scope.formData;
			if (data) {
				var next = function(entity) {
					finish();
				};
				if (data.id) {
					dcmsData.updateEntity('scoringParts', data).then(next);
				}
				else {
					dcmsData.createEntity('scoringParts', data).then(next);
				}
			}
		};
	}])
	.controller('scorersController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		dcmsData.getEntities('scorers').then(function(entities) {
			$scope.entities = entities;
		});
	}])
	.controller('scorerEditorController', ['$scope', '$state', '$stateParams', '$mdDialog', 'dcmsData', function($scope, $state, $stateParams, $mdDialog, dcmsData) {
		var id = $stateParams.id;
		if (id == 'new') {
			$scope.formData = { id: null, userDefined: true, type: 'rule' };
		}
		else {
			dcmsData.getEntity('scorers', id).then(function(entity) {
				$scope.formData = entity;
			});
		}

		var finish = function() {
			$scope.formData = null;
			$state.go('scorers');
		};
		$scope.cancel = function() {
			finish();
		}
		$scope.save = function() {
			var data = $scope.formData;
			if (data) {
				var next = function(entity) {
					finish();
				};
				if (data.id) {
					dcmsData.updateEntity('scorers', data).then(next);
				}
				else {
					dcmsData.createEntity('scorers', data).then(next);
				}
			}
		};

		$scope.addPart = function(ev) {
			var data = { type: 'PastDue' };
			$mdDialog.show({
				controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {
					dcmsData.getEntities('scoringParts').then(function(items) {
						$scope.items = items;
					});
					$scope.cancel = function() {
						$mdDialog.cancel();
					}
					$scope.select = function(data) {
						$mdDialog.hide(data);
					}
				}],
				templateUrl: 'scoringPartSelector.html',
				targetEvent: ev,
			}).then(function(part) {
				if (!$scope.formData.parts)
					$scope.formData.parts = [];
				$scope.formData.parts.push({ id: part.id, name: part.name, weight: 0 });
			});
		};
		$scope.deletePart = function(index) {
			var parts = $scope.formData.parts;
			parts.splice(index, 1);
			for (var i = index; i < parts.length; i++)
				--parts[i].seq;
		};
		$scope.viewPart = function(ev, index) {
			var part = $scope.formData.parts[index];
			$mdDialog.show(
				$mdDialog.alert()
					.title('Scoring part details')
					.content(part)
					.ariaLabel('Scoring part details')
					.ok('OK')
					.targetEvent(ev)
			);
		};

	}])
	.controller('letterPlansController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		dcmsData.getEntities('letterPlans').then(function(entities) {
			$scope.entities = entities;
		});
	}])
	.controller('letterPlanEditorController', ['$scope', '$state', '$stateParams', '$mdDialog', 'dcmsData', function($scope, $state, $stateParams, $mdDialog, dcmsData) {
		var id = $stateParams.id;
		dcmsData.getEntities('agingBuckets').then(function(buckets) {
		dcmsData.getEntities('scorers').then(function(scorers) {
			$scope.buckets = buckets;
			$scope.scorers = scorers;
			if (id == 'new') {
				$scope.formData = { id: null };
			}
			else {
				dcmsData.getEntity('letterPlans', id).then(function(letterPlan) {
					$scope.formData = letterPlan;
				});
			}
		});
		});

		var finish = function() {
			$scope.formData = null;
			$state.go('letterPlans');
		};
		$scope.cancel = function() {
			finish();
		};
		$scope.save = function() {
			var data = $scope.formData;
			if (data) {
				var next = function(entity) {
					finish();
				};
				if (data.id) {
					dcmsData.updateEntity('letterPlans', data).then(next);
				}
				else {
					dcmsData.createEntity('letterPlans', data).then(next);
				}
			}
		};

		$scope.$watch('formData.bucketId', function(newBucketId, oldBucketId) {
			var bucket = null;
			if (newBucketId) {
				for (var i = 0; i < $scope.buckets.length; i++) {
					if ($scope.buckets[i].id == newBucketId) {
						bucket = $scope.buckets[i];
					}
				}
			}
			$scope.selectedBucket = bucket;

			if ($scope.formData && newBucketId != oldBucketId) {
				$scope.formData.planLines = [];
			}
		});

		$scope.$watch('formData.scorerId', function(newScorerId, oldScorerId) {
			var scorer = null;
			if (newScorerId) {
				for (var i = 0; i < $scope.scorers.length; i++) {
					if ($scope.scorers[i].id == newScorerId) {
						scorer = $scope.scorers[i];
					}
				}
			}
			$scope.selectedScorer = scorer;

			if ($scope.formData && !$scope.formData.scorerParts) {
				$scope.formData.scorerParts = scorer ? scorer.parts : null;
			};
		});

		$scope.configureParts = function(ev) {
			var original = $scope.formData.scorerParts;
			var copy = original ? JSON.parse(JSON.stringify(original)) : {};
			$mdDialog.show({
				controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {
					$scope.data = copy;
					$scope.cancel = function() {
						$mdDialog.cancel();
					}
					$scope.save = function(data) {
						$mdDialog.hide(data);
					}
				}],
				templateUrl: 'letterPlanPartsDialog.html',
				targetEvent: ev,
			}).then(function(scorerParts) {
				$scope.formData.scorerParts = scorerParts;
			});
		};

		var planLineDialog = function(ev, line, selectedScorer, selectedBucket) {
			return $mdDialog.show({
				controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {
					$scope.line = line;
					$scope.selectedScorer = selectedScorer;
					$scope.selectedBucket = selectedBucket;
					$scope.selectBucketLine = function(ev) {
						$scope.items = selectedBucket.lines;
						$scope.selecting = 'bucketLine';
					};
					$scope.selectMethod = function(ev) {
						$scope.selecting = 'method';
					};
					$scope.selectTemplate = function(ev) {
						$scope.items = [{id:1, name:'tx1'}, {id:2, name:'tx2'}, {id:3, name:'tx3'}, {name:'tx4'}, {name:'tx5'}, {name:'tx6'}];
						$scope.selecting = 'template';
					};
					$scope.doSelection = function(item) {
						if ($scope.selecting == 'method')
							line.method = item;
						else if ($scope.selecting == 'template')
							line.template = { id: item.id, name: item.name };
						else if ($scope.selecting == 'bucketLine')
							line.bucketLine = { id: item.id, heading: item.heading };

						$scope.selecting = null;
					};
					$scope.cancel = function() {
						if ($scope.selecting)
							$scope.selecting = null;
						else
							$mdDialog.cancel();
					};
					$scope.save = function() {
						$mdDialog.hide($scope.line);
					};
				}],
				templateUrl: 'letterPlanLineDialog.html',
				targetEvent: ev,
			})
		};

		$scope.addPlanLine = function(ev) {
			var line = {
				bucketLine: { id: null },
				scoreLow: $scope.selectedScorer.minScore,
				scoreHigh: $scope.selectedScorer.maxScore,
				method: 'Email',
				template: { id: null },
				callback: { enabled: false, days: null }
			};
			planLineDialog(ev, line, $scope.selectedScorer, $scope.selectedBucket).then(function(line) {
				if (!$scope.formData.planLines)
					$scope.formData.planLines=[];
				$scope.formData.planLines.push(line);
			});
		};
		$scope.editPlanLine = function(ev, index) {
			var line = $scope.formData.planLines[index];
			planLineDialog(ev, line, $scope.selectedScorer, $scope.selectedBucket).then(function(line) {
				$scope.formData.planLines[index] = line;
			});
		};
		$scope.deletePlanLine = function(ev, index) {
			var lines = $scope.formData.planLines;
			lines.splice(index, 1);
		};
	}])
	.controller('letterTemplatesController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		dcmsData.getEntities('letterTemplates').then(function(entities) {
			$scope.entities = entities;
		});
	}])
	.controller('letterTemplateEditorController', ['$scope', '$state', '$stateParams', '$mdDialog', 'dcmsData', function($scope, $state, $stateParams, $mdDialog, dcmsData) {
		var id = $stateParams.id;
		//dcmsData.getEntities('scorers').then(function(scorers) {
			//$scope.scorers = scorers;
			if (id == 'new') {
				$scope.formData = { id: null };
			}
			else {
				dcmsData.getEntity('letterTemplates', id).then(function(letterPlan) {
					$scope.formData = letterPlan;
				});
			}
		//});

		var finish = function() {
			$scope.formData = null;
			$state.go('letterTemplates');
		};
		$scope.cancel = function() {
			finish();
		};
		$scope.save = function() {
			var data = $scope.formData;
			if (data) {
				var next = function(entity) {
					finish();
				};
				if (data.id) {
					dcmsData.updateEntity('letterTemplates', data).then(next);
				}
				else {
					dcmsData.createEntity('letterTemplates', data).then(next);
				}
			}
		};
	}])

	.service('dcmsJobTaskTypeMapper', [function() {
		return {
			fromSpecification: function(specification) {
				var data = {};
				if (specification) {
					data.id = specification.Id;
					data.name = specification.Name;
					data.code = specification.Code;
					data.description = specification.Description;
					if (specification.Definition) {
						if (specification.Definition.Properties) {
							var args = [];
							for (var propName in specification.Definition.Properties) {
								var prop = specification.Definition.Properties[propName];
								args.push({
									name: propName,
									type: prop.DataType,
									default: prop.Default,
								});
							}
							data.arguments = args;
						}
						if (specification.Definition.Nodes) {
							for (var nodeName in specification.Definition.Nodes) {
								var node = specification.Definition.Nodes[nodeName];
								if (node.Type == 'CodeActivity') {
									if (node.Parameters) {
										data.operation = node.Parameters.Operation;
									}
									break;
								}
							}
						}
					}
				}
				return data;
			},
			toSpecification: function(jobTask) {
				var specification = {
					Name: jobTask.name,
					Code: jobTask.code,
					Description: jobTask.description,
					Definition: {
						Nodes: {
							N1: { Type: 'StartEvent' },
							N2: { Type: 'CodeActivity', Parameters: { Operation: jobTask.operation, Arguments: 'container.Properties' } },
							N3: { Type: 'EndEvent' },
						},
						Transitions: [
							{ Source: 'N1', Target: 'N2' },
							{ Source: 'N2', Target: 'N3' },
						]
					}
				};
				if (jobTask.id)
					specification.Id = jobTask.id;
				if (jobTask.arguments) {
					properties = {};
					inMappings = [];
					for (var i = 0; i < jobTask.arguments.length; i++) {
						var arg = jobTask.arguments[i];
						properties[arg.name] = { DataType: arg.type, Default: arg.default };
						inMappings.push({
							Source: 'arguments.' + arg.name,
							Target: 'container.Properties.' + arg.name
						});
					}
					specification.Definition.Properties = properties;
					specification.Definition.InMappings = inMappings;
				}
				return specification;
			}
		};
	}])
	.controller('jobTasksTypesController', ['$scope', 'dcmsData', 'dcmsJobTaskTypeMapper', function($scope, dcmsData, dcmsJobTaskTypeMapper) {
		dcmsData.getEntities('jobTasksTypes').then(function(specifications) {
			var entities = [];
			for (var i = 0; i < specifications.length; i++) {
				entities.push(dcmsJobTaskTypeMapper.fromSpecification(specifications[i]));
			}
			$scope.entities = entities;
		});
	}])
	.controller('jobTasksTypeEditorController', ['$scope', '$state', '$stateParams', 'dcmsData', 'dcmsJobTaskTypeMapper', function($scope, $state, $stateParams, dcmsData, dcmsJobTaskTypeMapper) {
		var id = $stateParams.id;
		//dcmsData.getEntities('scorers').then(function(scorers) {
			//$scope.scorers = scorers;
			if (id == 'new') {
				$scope.formData = { id: null };
			}
			else {
				dcmsData.getEntity('jobTasksTypes', id, 'Id').then(function(entity) {
					$scope.formData = dcmsJobTaskTypeMapper.fromSpecification(entity);
				});
			}
		//});

		var finish = function() {
			$scope.formData = null;
			$state.go('jobTasks.types');
		};
		$scope.cancel = function() {
			finish();
		};
		$scope.save = function() {
			var spec = dcmsJobTaskTypeMapper.toSpecification($scope.formData);
			if (spec) {
				var next = function(entity) {
					finish();
				};
				if (spec.Id) {
					dcmsData.updateEntity('jobTasksTypes', spec, 'Id').then(next);
				}
				else {
					dcmsData.createEntity('jobTasksTypes', spec, 'Id').then(next);
				}
			}
		};
	}])
	.controller('jobTasksRunController', ['$scope', '$mdDialog', 'dcmsData', 'dcmsJobTaskTypeMapper', function($scope, $mdDialog, dcmsData, dcmsJobTaskTypeMapper) {
		var request = {
			jobTaskName: null,
			language: 'Default',
			schedule : {
				type: 'ASAP'
			}
		};

		$scope.request = request;
		$scope.canSubmitRequest = function() {
			return request.jobTaskName;
		};
		$scope.selectType = function(ev) {
			$mdDialog.show({
				controller: ['$scope', '$mdDialog', function($scope, $mdDialog) {
					dcmsData.getEntities('jobTasksTypes').then(function(specifications) {
						var items = [];
						for (var i = 0; i < specifications.length; i++) {
							items.push(dcmsJobTaskTypeMapper.fromSpecification(specifications[i]));
						}
						$scope.items = items;
					});
					$scope.cancel = function() {
						$mdDialog.cancel();
					}
					$scope.select = function(data) {
						$mdDialog.hide(data);
					}
				}],
				templateUrl: 'jobTask.typeSelector.html',
				targetEvent: ev,
			}).then(function(taskType) {
				request.jobTaskName = taskType.name;
				request.arguments = [];

				var args = taskType.arguments;
				if (args && args.length) {
					for (var i=0;i<args.length;i++) {
						var arg = args[i];
						request.arguments.push({
							name: arg.name,
							value: arg.default,
						});
					}
				}
			});
		};
		$scope.submit = function(ev) {
			dcmsData.createEntity('jobTasks', request).then(function(entity) {
				$mdDialog.show(
					$mdDialog.alert()
						.title('Success')
						.content('The job submitted with id ' + entity.id + '.')
						.ok('OK')
						.targetEvent(ev)
				);
			}, function(err) {
				$mdDialog.show(
					$mdDialog.alert()
						.title('Error')
						.content('The job fail to submit: ' + err)
						.ok('OK')
						.targetEvent(ev)
				);
			});
		};
	}])
	.controller('targetGroupsController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		dcmsData.getEntities('targetGroups').then(function(entities) {
			$scope.entities = entities;
		});
	}])
	.controller('targetGroupEditorController', ['$scope', '$state', '$stateParams', 'dcmsData', function($scope, $state, $stateParams, dcmsData) {
		var id = $stateParams.id;
		if (id == 'new') {
			$scope.formData = {
				id: null,
			};
		}
		else {
			dcmsData.getEntity('targetGroups', id).then(function(entity) {
				$scope.formData = entity;
			});
		}

		var finish = function() {
			$scope.formData = null;
			$state.go('targetGroups');
		};
		$scope.cancel = function() {
			finish();
		};
		$scope.save = function() {
			var data = $scope.formData;
			if (data) {
				var next = function(entity) {
					finish();
				};
				if (data.id) {
					dcmsData.updateEntity('targetGroups', data).then(next);
				}
				else {
					dcmsData.createEntity('targetGroups', data).then(next);
				}
			}
		};
	}])
	.controller('strategiesController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		dcmsData.getEntities('strategies').then(function(entities) {
			$scope.entities = entities;
		});
	}])
	.controller('strategyEditorController', ['$scope', '$state', '$stateParams', 'dcmsData', function($scope, $state, $stateParams, dcmsData) {
		var id = $stateParams.id;
		if (id == 'new') {
			$scope.formData = {
				id: null,
			};
		}
		else {
			dcmsData.getEntity('strategies', id).then(function(entity) {
				$scope.formData = entity;
			});
		}

		var finish = function() {
			$scope.formData = null;
			$state.go('strategies');
		};
		$scope.cancel = function() {
			finish();
		};
		$scope.save = function() {
			var data = $scope.formData;
			if (data) {
				var next = function(entity) {
					finish();
				};
				if (data.id) {
					dcmsData.updateEntity('strategies', data).then(next);
				}
				else {
					dcmsData.createEntity('strategies', data).then(next);
				}
			}
		};
	}])
	.controller('strategyDesignerController', ['$scope', '$state', '$stateParams', '$mdMedia', 'dcmsData', function($scope, $state, $stateParams, $mdMedia, dcmsData) {
		$scope.canShowDesigner = $mdMedia('lg');
	}])
	;
