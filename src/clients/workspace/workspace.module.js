angular.module('workspace', [
		'ui.router',
		'ngMaterial',
		'ngMessages',
		'atlas',
		'titan',
		'directives',
		'dcmsData',
    ])
    .config(['$stateProvider', '$urlRouterProvider', '$mdIconProvider', function ($stateProvider, $urlRouterProvider, $mdIconProvider) {

        $mdIconProvider.iconSet('core', '../assets/img/core-icons.svg', 24);

		$urlRouterProvider
			.when('/tasks/{id}', '/tasks/{id}/home')
			.otherwise('/');

        $stateProvider
			.state('home', {
				url: '/',
				templateUrl: 'home.html',
				controller: 'homeController',
			})
            .state('inbox', {
				url: '/inbox',
				templateUrl: 'inbox.html',
				controller: 'inboxController',
			})
			.state('task', {
				url: '/tasks/:id',
				templateUrl: 'task.main.html',
				controller: 'taskMainController',
				redirectTo: 'task.home',
			})
			.state('task.home', {
				url: '/home',
				templateUrl: 'task.home.html',
				controller: 'taskHomeController',
			})
			.state('task.profile', {
				url: '/profile',
				templateUrl: 'task.profile.html',
				controller: 'taskProfileController',
			})
			.state('task.history', {
				url: '/history',
				templateUrl: 'task.history.html',
				controller: 'taskHistoryController',
			})
			.state('task.accounts', {
				url: '/accounts',
				templateUrl: 'task.accounts.html',
			})
			.state('task.transactions', {
				url: '/transactions',
				templateUrl: 'task.transactions.html',
				controller: 'taskTransactionsController',
			})
			.state('task.strategies', {
				url: '/strategies',
				templateUrl: 'task.strategies.html',
				controller: 'taskStrategiesController',
			})
			.state('task.strategy', {
				url: '/strategies/:strategyId',
				templateUrl: 'task.strategy.html',
				controller: 'taskStrategyController',
			})
			.state('task.aging', {
				url: '/aging',
				templateUrl: 'task.aging.html',
			})
			.state('task.notes', {
				url: '/notes',
				templateUrl: 'task.notes.html',
				controller: 'taskNotesController',
			})
			.state('task.tasks', {
				url: '/tasks',
				templateUrl: 'task.tasks.html',
			})
			.state('task.payment', {
				url: '/payment',
				templateUrl: 'task.payment.html',
				controller: 'taskPaymentController',
			})
            ;
    }])
	.run(['$rootScope', '$state', function ($rootScope, $state) {
		$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
			/* Hack: https://github.com/angular-ui/ui-router/issues/1584 */
			if (toState.redirectTo) {
				event.preventDefault();
		        $state.go(toState.redirectTo, toParams)
      		}
			//if (!spa.isSignedOn() && toState.name != 'signin' && !toState.allowAnonymous) {
			//	spa.suspendRoute(toState, toParams);
			//	$state.go('signin');
			//	event.preventDefault();
			//}
		});
	}])

    /************************************************************************
	 ****************************** SERVICES ********************************
	 ************************************************************************/
    .factory('spa', [function() {
        return {
            isSignedOn: function() { return true; }
        };
    }])

    /************************************************************************
 	 **************************** DIRECTIVES ********************************
 	 ************************************************************************/

    /************************************************************************
  	 **************************** CONTROLLERS *******************************
  	 ************************************************************************/
  	.controller('appController', ['$scope', '$mdSidenav', '$state', 'spa', function($scope, $mdSidenav, $state, spa) {
        $scope.goHome = function() {
        	$state.go('home');
        };
        $scope.hasUser = spa.isSignedOn;

        $scope.goUserProfile = function() {
        	$state.go('userProfile');
        };
        $scope.toggleSidenav = function(id) {
        	$mdSidenav(id).toggle();
        };
		$scope.toggleUserMenu = function() {
        	$scope.userMenuVisible = !$scope.userMenuVisible;
        };
        console.info('Workspace started');
    }])
  	.controller('homeController', ['$state', function($state) {
          $state.go('inbox');
    }])
    .controller('inboxController', ['$scope', '$state', function($scope, $state) {
		var state =  {
			loaded: false,
			error: null
		};
		var load = function() {
			$scope.state = state;

			$scope.tasks = [
				{ id: 1, creationDate: '2015-05-15T14:37:08.880Z' },
				{ id: 2, },
				{ id: 3, },
			];

			$scope.viewTask = function(index) {
				var task = $scope.tasks[index];
				$state.go('task', { id: task.id });
			};

			state.loaded = true;
		};
		load();
    }])
	.controller('taskMainController', ['$scope', '$q', '$state', '$stateParams', 'dcmsData', function($scope, $q, $state, $stateParams, dcmsData) {
		var state =  {
			loaded: false,
			error: null,
			currentTaskId: $stateParams.id,
		};
		$scope.state = state;
		$scope.data = {};
		$scope.go = function(tabName) {
			$state.go('task.' + tabName, { id: state.currentTaskId });
		};
		var tabStates = {
			'task.home': 0,
			'task.profile': 1,
			'task.history': 2,
			'task.accounts': 3,
			'task.transactions': 4, 'task.payment': 4,
			'task.strategies': 5, 'task.strategy': 5,
			'task.aging': 6,
			'task.notes': 7,
			'task.tasks': 8
		};
		$scope.selectedTabIndex = tabStates[$state.current.name];
		$scope.getTask = function() {
			if (state.currentTask) {
				state.loaded = true;
				return $q(function(resolve, reject) { resolve(state.currentTask); });
			}
			else {
				return dcmsData.getEntity('tasks', state.currentTaskId).then(function(task) {
					state.loaded = true;
					state.currentTask = task;
					return task;
				});
			}
		};
	}])
	.controller('taskHomeController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		if (!$scope.data.summary) {
			$scope.getTask().then(function(task) {
				dcmsData.getEntity('customerSummaries', task.customer.summaryId).then(function(summary){
					$scope.data.summary = summary;
				});
			});
		}
	}])
	.controller('taskProfileController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		if (!$scope.data.profile) {
			$scope.getTask().then(function(task) {
				dcmsData.getEntity('customerProfiles', task.customer.profileId).then(function(profile){
					$scope.data.profile = profile;
				});
			});
		}
	}])
	.controller('taskHistoryController', ['$scope', 'dcmsData', function($scope, dcmsData) {
		if (!$scope.data.history) {
			$scope.getTask().then(function(task) {
				dcmsData.getEntity('customerHistory', task.customer.historyId).then(function(history){
					$scope.data.history = history;
				});
			});
		}
		$scope.viewDetails = viewDetails;

		// -------------------------------
		function viewDetails(item) {
			window.alert('viewDetails: Not Implemented!');
		}
	}])
	.controller('taskTransactionsController', ['$scope', '$state', 'dcmsData', function($scope, $state, dcmsData) {
		var taskId = null;
		$scope.getTask().then(function(task) {
			taskId = task.id;
			if (!$scope.data.transactions) {
				dcmsData.getEntity('customerTransactions', task.customer.transactionListId).then(function(list){
					$scope.data.transactions = list.items;
				});
			}
		});

		$scope.filterTransactions = function() {
			window.alert('filterTransactions: Not implemented!');
		};
		$scope.viewDetails = function(id) {
			window.alert('viewDetails: Not implemented!');
		};
		$scope.processPayment = function() {
			$state.go('task.payment', { id: taskId })
		};
		$scope.processAdjustment = function() {
			window.alert('processAdjustment: Not implemented!');
		};
	}])
	.controller('taskPaymentController', ['$scope', '$state', 'dcmsData', function($scope, $state, dcmsData) {
		var initialize = function(items) {
			var pendingTransactions = [];
			var sums = {
				original: 0,
				remaining: 0,
				payment: 0
			};
			for (var i=0; i<items.length; i++)
				if (items[i].status == 'delinquent') {
					var pendingTransaction = items[i];
					pendingTransaction.payment = null;
					sums.original += pendingTransaction.originalAmount;
					sums.remaining += pendingTransaction.remainingAmount;
					pendingTransactions.push(pendingTransaction);
				}
			$scope.pendingTransactions = pendingTransactions;
			$scope.sums = sums;
			$scope.cancel = function() {
				$state.go('task.transactions', { id: $scope.state.currentTaskId });
			};
			$scope.submit = function() {
				window.alert('submit: Not implemented!');
			};
			$scope.toggle = function(item) {
				if (item) {
					toggleItem(item);
				}
				else {
					var list = $scope.pendingTransactions;
					for (var i = 0; i < list.length; i++) {
						toggleItem(list[i]);
					}
				}
			}
		}

		var toggleItem = function(item) {
			if (item.payment) {
				$scope.sums.payment -= item.payment.amount;
				item.payment = null;
			}
			else {
				item.payment = {
					amount: item.remainingAmount
				};
				$scope.sums.payment += item.payment.amount;
			}
		};

		if ($scope.data.transactions) {
			initialize($scope.data.transactions);
		}
		else {
			$scope.getTask().then(function(task) {
				dcmsData.getEntity('customerTransactions', task.customer.transactionListId).then(function(list){
					initialize(list.items);
				});
			});
		}
	}])
	.controller('taskStrategiesController', ['$scope', '$state', 'dcmsData', function($scope, $state, dcmsData) {
		$scope.viewStrategy = viewStrategy;
		initialize();

		function initialize() {
			$scope.getTask().then(function(task) {
				if (!$scope.data.strategies) {
					dcmsData.getEntity('customerStrategies', task.customer.strategyListId).then(function(list){
						$scope.data.strategies = list;
					});
				}
			});
		}
		function viewStrategy(strategy) {
			$scope.getTask().then(function(task) {
				$state.go('task.strategy', { id: task.id, strategyId: strategy.id })
			});
		}
	}])
	.controller('taskStrategyController', ['$scope', '$state', '$stateParams', '$mdDialog', 'dcmsData', function($scope, $state, $stateParams, $mdDialog, dcmsData) {
		$scope.viewDetails = viewDetails;
		$scope.viewActions = viewActions;
		$scope.cancel = cancel;
		initialize();

		function initialize() {
			var strategyId = $stateParams.strategyId;
			$scope.getTask().then(function(task) {
				if ($scope.data.strategies) {
					$scope.strategy = findStrategy($scope.data.strategies.items, strategyId);
				}
				else {
					dcmsData.getEntity('customerStrategies', task.customer.strategyListId).then(function(list){
						$scope.strategy = findStrategy(list.items, strategyId);
					});
				}
			});
		}
		function viewDetails(step) {
			window.alert('viewDetails: Not implemented!');
		}
		function viewActions(evt, step) {
			$mdDialog.show({
				clickOutsideToClose: true,
				targetEvent: evt,
				templateUrl: 'task.strategy.actions.html',
				controller: function(scope, $mdDialog) {
					scope.complete = function() {
						$mdDialog.hide();
						window.alert('viewActions.complete: Not implemented!');
					},
					scope.closeDialog = function() {
						$mdDialog.hide();
					}
				}
			});
		}
		function findStrategy(list, strategyId) {
			for (var i = 0; i < list.length; i++) {
				if (list[i].id == strategyId)
					return list[i];
			}
			return null;
		}
		function cancel() {
			$scope.getTask().then(function(task) {
				$state.go('task.strategies', { id: task.id })
			});
		}
	}])
	.controller('taskNotesController', ['$scope', '$state', 'dcmsData', function($scope, $state, dcmsData) {
		$scope.getTask().then(function(task) {
			if (!$scope.data.comments) {
				dcmsData.getEntity('taskComments', task.id).then(function(comments) {
					$scope.data.comments = comments;
				});
			}
		});

		$scope.submitComment = function(content) {
			if (content) {
				var comment = { date: new Date(), author: 'loggedinUser', content: content };
				$scope.data.comments.items.push(comment);
				dcmsData.updateEntity('taskComments', $scope.data.comments).then(function(comments){
					$scope.data.comments = comments;
				});
			}
		};
	}])
    ;
