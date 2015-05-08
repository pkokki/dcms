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
			dunningPlans: [{ id: 1, name: 'Plan #1', description: null, level: 'BillTo', enabled: true,  }],
			scoreParts: [ { id: 1, name:'p1', description: null, enabled: true, foundation: true, type: 'Rule|Exp|Resource', value: null } ],
			scorers: [ { id: 1, name:'p1', description: null, enabled: true, foundation: true, level: 'BillTo',
				minScore: 0, maxScore: 100 } ],
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
			getEntity: function(type, id) {
				return $q(function(resolve, reject) {
					var entities = traverseForArray(data, type);
					if (entities) {
						var found = null;
						for (var i = 0; i < entities.length; i++) {
							var entity = entities[i];
							if (entity && entity.id == id) {
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
			createEntity: function(type, entity) {
				return $q(function(resolve, reject) {
					var entities = traverseForArray(data, type);
					if (entities) {
						var max = 0;
						for (var i = 0; i < entities.length; i++) {
							max = Math.max(max, entities[i].id);
						}
						var newObj = { id: max + 1 };
						var input = JSON.parse(JSON.stringify(entity));
						delete input.id;
						angular.extend(newObj, input);
						entities.push(newObj);
						resolve(JSON.parse(JSON.stringify(newObj)));
					}
					else {
						reject('Entity type "' + type + '" not found.');
					}
				});
			},
			updateEntity: function(type, entity) {
				return $q(function(resolve, reject) {
					if (entity && entity.id) {
						var entities = traverseForArray(data, type);
						if (entities) {
							var found = null;
							for (var i = 0; i < entities.length; i++) {
								if(entities[i].id == entity.id) {
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
								reject('Entity with id "' + id + '" and type "' + type + '" not exists.');
							}
						}
						else {
							reject('Entity type "' + type + '" not found.');
						}
					}
					else {
						reject('Entity is null or has no id.');
					}
				});
			},
			deleteEntity: function(type, id) {
				return $q(function(resolve, reject) {
					var entities = traverseForArray(data, type);
					if (entities) {
						var target = null;
						for (var i = 0; i < entities.length; i++) {
							var entity = entities[i];
							if (entity && entity.id == id) {
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
;
