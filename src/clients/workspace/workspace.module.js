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

		$urlRouterProvider.otherwise('/');

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
			.state('taskViewer', {
				url: '/tasks/:id',
				templateUrl: 'taskViewer.html',
				controller: 'taskViewerController',
			})
            ;
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
				$state.go('taskViewer', { id: task.id });
			};

			state.loaded = true;
		};
		load();
    }])
	.controller('taskViewerController', ['$scope', '$stateParams', 'dcmsData', function($scope, $stateParams, dcmsData) {
		var id = $stateParams.id;
		dcmsData.getEntity('tasks', id).then(function(task) {
			//$scope.formData = entity;
		});
	}])
    ;
