angular.module('workspace', [
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
			})
            .state('inbox', {
				url: '/inbox',
				templateUrl: 'inbox.html',
				controller: 'inboxController',
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
    .controller('inboxController', ['$scope', function($scope) {

    }])
    ;
