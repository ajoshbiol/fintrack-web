var app = angular.module('Fintrack', ['ngMaterial']);

// Main controller for cards in the Interests section
app.controller('TransactionsCtrl', ['$scope', '$http', function($scope, $http) {
    
}]);

// Function to retrieve transactions from Fintrack service
function getTransactions($http, callback) {
    $http({
        method : 'GET',
        url : serviceUrl
    })
    .then(function success(response) {
        return callback(null, response.data);
    }, function error(response) {
        return callback(response);
    });
}
