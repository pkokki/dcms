angular.module('directives', [])
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
    .directive('mdaViewPart', [function(){
        return {
            restrict: 'E',
            scope: {
                label: '@',
                value: '=',
            },
            template: '<div style="padding: 2px;"><div style="padding-left: 2px; color: rgba(0,0,0,0.60); transform: translate3d(0, 4px, 0) scale(0.75); transform-origin: left top; -webkit-font-smoothing: antialiased;">{{label}}</div><div style="padding: 2px;min-height:26px;">{{value}}</div></div>',
        }
    }])
    ;
