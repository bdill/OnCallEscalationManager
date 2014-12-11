var OCEM = angular.module('OnCallEscalationManager', ['ngRoute', 'ui.bootstrap', 'ui.mask', 'googlechart']);

OCEM.controller('indexCtlr', ['$scope','$http', indexCtrl]);
OCEM.controller('detailCtlr', ['$scope','$http', '$routeParams', '$timeout', detailCtrl]);
OCEM.controller('newAppCtrl', ['$scope','$http', '$route', newAppCtrl]);
OCEM.controller('newStaffCtrl', ['$scope', '$http', '$route', '$routeParams', newStaffCtrl]);
OCEM.controller('removeAppCtrl', ['$scope', '$http', '$modal', '$routeParams', '$location', removeAppCtrl]);
OCEM.controller('removeModalCtrl', ['$scope', '$modalInstance', removeModalCtrl]);
OCEM.controller('editAppCtrl', ['$scope', '$http', '$route', '$routeParams', editAppCtrl]);
OCEM.controller('editStaffCtrl', ['$scope', '$http', '$route', '$routeParams', editStaffCtrl]);
OCEM.controller('removeStaffCtrl', ['$scope', '$http', '$route', '$routeParams', removeStaffCtrl]);
OCEM.controller('segmentCtrl', ['$scope', '$http', '$modal', '$route', '$routeParams', '$location', segmentCtrl]);
OCEM.controller('failureCtlr', ['$scope','$http', failureCtrl]);
OCEM.controller('historyCtrl', ['$scope', '$http', '$routeParams', historyCtrl]);
OCEM.controller('timeSpentCtrl', ['$scope', '$http', '$routeParams', timeSpentCtrl]);

OCEM.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider
        .when('/', {
            templateUrl: '/partials/Index',
            controller: 'indexCtlr'
        })
        .when('/Applications/:appName', {
            templateUrl: '/partials/detail',
            controller: 'detailCtlr'
        })
        .when('/Applications/:appName/history', {
            templateUrl: '/partials/history',
            controller: 'historyCtrl'
        })
        .when('/Applications/:appName/timeSpent', {
            templateUrl: '/partials/timeSpent',
            controller: 'timeSpentCtrl'
        })
        .when('/failure', {
            templateUrl: '/partials/failure',
            controller: 'failureCtlr'
        })
        .otherwise({
            redirectTo: '/'
        });
  }]);

OCEM.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(function() {
        return {
            request: function(request) {
                if (request.method === 'GET') {
                    if (request.url.indexOf('.') === -1) {
                        var sep = request.url.indexOf('?') === -1 ? '?' : '&';
                        request.url = request.url + sep + 'cacheBust=' + new Date().getTime();
                    }
                }
                return request;
            }
        };
    });
}])

function failureCtrl($scope, $http) {
    //Nothing here yet.
}

function indexCtrl($scope, $http) {
    $scope.colorCount = 5;
    $scope.method = 'GET';
    $scope.url = '/api/applications/';
    $scope.isCollapsed = true;
    $scope.count = 0;
    $scope.curSegBool = false;
    var date = moment();
    var apps;

    $http({method: $scope.method, url: $scope.url}).
        success(function(data, status) {
        $scope.status = status;
        $scope.apps = data.results;
        apps = data.results;
        apps.forEach(function(app){
            currentSegment(app.Segments, function(err, foundSegment){
                if(foundSegment){
                    app.curSeg = foundSegment;
                }
            });
        });
    })
    .error(function(data, status) {
        $scope.apps = data.results || "Request failed";
        $scope.status = status;
    });
}

function detailCtrl($scope, $http, $routeParams, $timeout) {
    $scope.method = 'GET';
    $scope.url = '/api/applications/' + $routeParams.appName;
    $scope.appName = $routeParams.appName;
    $scope.isCollapsed = true;
    $scope.isEditingApp = false;
    var date = moment();
    $scope.date = date;
    var appl;
    var segments = [];
    var emptySegment = new Object();

    $http({method: $scope.method, url: $scope.url}).
        success(function(data, status) {
        $scope.status = status;
        $scope.app = data.results;
        appl = data.results;

        if (appl.Segments) {
            appl.Segments.sort(function(a,b){
                  return moment(a.StartDate).utc() - moment(b.StartDate).utc();
            });
        }

        // Check if the first segment is current
        if(!appl.Segments || appl.Segments.length == 0 || moment(appl.Segments[0].StartDate).isAfter(date)){
            emptySegment.StartDate = moment().utc();
            emptySegment.StartDate.hour(0);
            if(appl.Segments && appl.Segments.length > 0){
                emptySegment.EndDate = moment(appl.Segments[0].StartDate).utc();
                emptySegment.EndDate.subtract(1, 'd');
                emptySegment.EndDate.hour(0);

                //Turn the dates in to moment objects
                appl.Segments[0].StartDate = moment(appl.Segments[0].StartDate).utc();
                appl.Segments[0].EndDate = moment(appl.Segments[0].EndDate).utc();
                //Set hours back to 0
                appl.Segments[0].StartDate.hours(0);
                appl.Segments[0].EndDate.hours(0);
                //Lets now create a new field on the segment to hold the string representation.
                appl.Segments[0].StartDateString = appl.Segments[0].StartDate.format("MM/DD/YYYY");
                appl.Segments[0].EndDateString = appl.Segments[0].EndDate.format("MM/DD/YYYY");
                emptySegment.StartDateString = emptySegment.StartDate.format("MM/DD/YYYY");
                emptySegment.EndDateString = emptySegment.EndDate.format("MM/DD/YYYY");

                segments.push(emptySegment);
                segments.push(appl.Segments[0]);
            } else {
                emptySegment.EndDate = moment(emptySegment.StartDate).utc();
                // Default to a 7 day empty segment
                emptySegment.EndDate.add(7, 'd');
                emptySegment.EndDate.hour(0);
                //Lets now create a new field on the segment to hold the string representation.
                emptySegment.StartDateString = emptySegment.StartDate.format("MM/DD/YYYY");
                emptySegment.EndDateString = emptySegment.EndDate.format("MM/DD/YYYY");
                segments.push(emptySegment);
            }
        } else {
            //Turn the dates in to moment objects
            appl.Segments[0].StartDate = moment(appl.Segments[0].StartDate).utc();
            appl.Segments[0].EndDate = moment(appl.Segments[0].EndDate).utc();
            //Set hours back to 0
            appl.Segments[0].StartDate.hours(0);
            appl.Segments[0].EndDate.hours(0);
            appl.Segments[0].StartDateString = appl.Segments[0].StartDate.format("MM/DD/YYYY");
            appl.Segments[0].EndDateString = appl.Segments[0].EndDate.format("MM/DD/YYYY");
            segments.push(appl.Segments[0]);
        }

        var ped;
        // If there are more segments lets navigate through them and add empty segments if needed.
        if(appl.Segments.length > 0){
            //ped is previous end date
            ped = moment(appl.Segments[0].EndDate);

            for(var i = 1; i < appl.Segments.length; i++){
                //csd is current start date
                var csd = moment(appl.Segments[i].StartDate);
                if(1 == csd.diff(ped, 'd')) {
                    //Turn the dates in to moment objects
                    appl.Segments[i].StartDate = moment(appl.Segments[i].StartDate).utc();
                    appl.Segments[i].EndDate = moment(appl.Segments[i].EndDate).utc();
                    //Set hours back to 0
                    appl.Segments[i].StartDate.hour(0);
                    appl.Segments[i].EndDate.hour(0);

                    //Lets now create a new field on the segment to hold the string representation.
                    appl.Segments[i].StartDateString = appl.Segments[i].StartDate.format("MM/DD/YYYY");
                    appl.Segments[i].EndDateString = appl.Segments[i].EndDate.format("MM/DD/YYYY");
                    segments.push(appl.Segments[i]);
                } else {
                    //prep new empty segment
                    emptySegment = new Object();
                    emptySegment.StartDate = moment(ped.add(1, 'd')).utc();
                    // cur start date to set new end date
                    emptySegment.EndDate = moment(csd.subtract(1, 'd')).utc();

                    //Turn the dates in to moment objects
                    appl.Segments[i].StartDate = moment(appl.Segments[i].StartDate).utc();
                    appl.Segments[i].EndDate = moment(appl.Segments[i].EndDate).utc();

                    //Set hours back to 0
                    appl.Segments[i].StartDate.hour(0);
                    appl.Segments[i].EndDate.hour(0);

                    //Lets now create a new field on the segment to hold the string representation.
                    appl.Segments[i].StartDateString = appl.Segments[i].StartDate.format("MM/DD/YYYY");
                    appl.Segments[i].EndDateString = appl.Segments[i].EndDate.format("MM/DD/YYYY");
                    emptySegment.StartDateString = emptySegment.StartDate.format("MM/DD/YYYY");
                    emptySegment.EndDateString = emptySegment.EndDate.format("MM/DD/YYYY");
                    segments.push(emptySegment);
                    segments.push(appl.Segments[i]);
                }
                //update previous end date
                ped = moment(appl.Segments[i].EndDate);
            }
        }
        //Add in the last segment
        if(ped){
            emptySegment = new Object();
            emptySegment.StartDate = moment(ped.add(1, 'd')).utc();
            emptySegment.EndDate = moment(ped.add(7, 'd')).utc();
            emptySegment.StartDateString = emptySegment.StartDate.format("MM/DD/YYYY");
            emptySegment.EndDateString = emptySegment.EndDate.format("MM/DD/YYYY");
            segments.push(emptySegment);
        }
        //finish up by setting the Segments to equal the new fully filled list of segments.
        $scope.app.Segments = segments;

        findPrimary($scope.app.Segments, function(primary) {
            $scope.primary = primary;
        });
        findSecondary($scope.app.Segments, function(secondary) {
            $scope.secondary = secondary;
        });

        console.log($scope.primary);
    })
    .error(function(data, status) {
        $scope.app = data.results || "Request failed";
        $scope.status = status;
    });

    var timeout_promise;
    $scope.conference = {};

    (function tick() {
        $http.get('/api/applications/' + $routeParams.appName + '/calls').
            success(function (data, status) {
                var conferenceSid = getConferenceSid(data.results);

                if (conferenceSid) {
                    $scope.conference.status = "In Progress";
                    $scope.conference.dateCreated = getConferenceDateCreated(data.results);

                    $http.get('/api/applications/' + $routeParams.appName + '/calls/' + conferenceSid + '/participants').
                    success(function (data, status) {
                        $scope.conference.participants = data.results;
                    }).
                    error(function (data, status) {
                        console.log("Unable to fetch call participants for " + conferenceSid);
                        $scope.apps = data.results;
                        $scope.status = status;
                        $scope.conference.participants = data.results;
                    });
                } else {
                    $scope.conference.status = "Inactive";
                    $scope.conference.dateCreated = "N/A";
                    delete $scope.conference.participants;
                }

                timeout_promise = $timeout(tick, 5000);
            }).
            error(function (data, status) {
                console.log("Unable to fetch calls");
                $scope.apps = data.results;
                $scope.status = status;
            });

    })();

    $scope.$on('$destroy', function() {
        console.log("destroyed");
        $timeout.cancel(timeout_promise);
    });
}

function getConferenceSid(results) {
    if (results.conferences.length > 0) {
        return results.conferences[0].sid;
    }
}

function getConferenceDateCreated(results) {
    if (results.conferences.length > 0) {
        return moment(results.conferences[0].dateCreated).format("MM/DD/YYYY");
    }
}

function newAppCtrl($scope, $http, $route) {
    $scope.form = {};
    $scope.form.appName = "";
    $scope.form.appPhone = "";

    $scope.form.submit = function (item, event) {
        var dataObject = {
            Name: $scope.form.appName,
            Phone: $scope.form.appPhone
        };

        var responsePromise = $http.post("/api/applications/", dataObject, {});
        responsePromise.success(function (data, status) {
            $route.reload();
        });
        responsePromise.error(function (data, status) {
            alert(data.Message);
        });
    };

    $scope.form.empty = function () {
        $scope.form.appName = "";
        $scope.form.appPhone = "";
    };
}

function newStaffCtrl($scope, $http, $route, $routeParams){
    $scope.form = {};
    $scope.staffName ="";
    $scope.staffPrimary ="";

    $scope.form.submit = function (item, event) {
        var dataObject = {
            Name: $scope.form.staffName,
            Phone: $scope.form.staffPrimary
        };
        var responsePromise = $http.post("/api/applications/" + $routeParams.appName + "/staff/", dataObject, {});
        responsePromise.success(function (data, status) {
            $route.reload();
        });
        responsePromise.error(function (data, status) {
            alert(data);
            alert(data.Message);
        });
    };
}

function removeAppCtrl($scope, $http, $modal, $routeParams, $location) {
    $scope.open = function (size) {

        var modalInstance = $modal.open({
            templateUrl: 'removeAppModal.jade',
            controller: 'removeModalCtrl',
            size: size
        });

        modalInstance.result.then(function () {
            var responsePromise = $http.delete("/api/applications/" + $routeParams.appName, {});
            responsePromise.success(function (data, status) {
                $location.path("/");
            });
            responsePromise.error(function (data, status) {
                alert(data.Message);
            });
        });
    }
}

function removeModalCtrl($scope, $modalInstance){
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function editAppCtrl($scope, $http, $route, $routeParams){
    $scope.form = {};
    $scope.form.appPhone ="";
    $scope.form.appFallback ="";

    $http({method: 'GET', url: '/api/applications/' + $routeParams.appName})
    .success(function(data, status) {
        $scope.status = status;
        $scope.app = data.results;

        $scope.form.appPhone = $scope.app.Phone;
        if ($scope.app.Fallback) {
            $scope.form.appFallback = $scope.app.Fallback;
        }
    })
    .error(function(data, status) {
        $scope.app = data.results || "Request failed";
        $scope.status = status;
    });

    $scope.form.submit = function (item, event) {
        var dataObject = {
            Phone: $scope.form.appPhone,
            Fallback: $scope.form.appFallback._id
        };
        var responsePromise = $http.put("/api/applications/" + $routeParams.appName, dataObject, {});
        responsePromise.success(function (data, status) {
            $route.reload();
        });
        responsePromise.error(function (data, status) {
            alert(data.Message);
        });
    };

    $scope.getStaffString = function(staff) {
        return staff.Name + " - " + staff.Primary;
    }
}

function editStaffCtrl($scope, $http, $route, $routeParams){
    $scope.isEditingStaff = false;
    $scope.form = {};
    //$scope.form.staffName = "boob";
    
    $scope.form.submit = function (item, event) {
        var dataObject = {
            Name: $scope.form.staffName,
            Phone: $scope.form.staffPrimary
        };
        var responsePromise = $http.put("/api/applications/" + $routeParams.appName + "/staff/" + $scope.form.oldPrimary.split(" ").join(""), dataObject, {});
        responsePromise.success(function (data, status) {
            $route.reload();
        });
        responsePromise.error(function (data, status) {
            alert(data.Message);
        });
    };

}

function removeStaffCtrl($scope, $http, $route, $routeParams){

    $scope.removeStaff = function (Primary) {
        var responsePromise = $http.delete("/api/applications/" + $routeParams.appName + "/staff/" + Primary.split(" ").join(""));
        responsePromise.success(function (data, status) {
            $route.reload();
        });
        responsePromise.error(function (data, status) {
            alert(data.Message);
        });
    };

}

function segmentCtrl($scope, $http, $modal, $route, $routeParams, $location){
    $scope.isSegmentActive = false;
    $scope.form = {};

    $scope.dateOptions = {
        showWeeks: false,
        showButtonBar: false
    };

    $scope.datepickers = {
        StartOpen: false,
        EndOpen: false
    };

    $scope.open = function($event, which) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.closeAll();
        $scope.datepickers[which]= true;
    };

    $scope.closeAll = function() {
        $scope.datepickers.StartOpen = false;
        $scope.datepickers.EndOpen = false;
    };

    $scope.removeSegment = function (size) {
        var modalInstance = $modal.open({
            templateUrl: 'removeSegmentModal.jade',
            controller: 'removeModalCtrl',
            size: size
        });

        modalInstance.result.then(function () {
            var sd = $scope.form.StartDate.split('/').join('-');
            var responsePromise = $http.delete("/api/applications/" + $routeParams.appName + "/segments/" + sd, {});
            responsePromise.success(function (data, status) {
                //alert(data.results.StartDate);
                $route.reload();
            });
            responsePromise.error(function (data, status) {
                alert(data);
            });
        });
    };

    $scope.addSegment = function () {
        var dataObject = {
            StartDate: $scope.form.StartDate,
            EndDate: $scope.form.EndDate,
            PrimaryStaff: $scope.form.PrimaryStaff.Primary
        };
        if ($scope.form.SecondaryStaff) {
            dataObject.SecondaryStaff = $scope.form.SecondaryStaff.Primary;
        }
        dataObject.Editor = "Brian Dill";

        var responsePromise = $http.post("/api/applications/" + $routeParams.appName + "/segments/", dataObject, {});
        responsePromise.success(function (data, status) {
            $route.reload();
        });
        responsePromise.error(function (data, status) {
            alert(data.Message);
        });
    };

    $scope.editSegment = function () {
        var dataObject = {
            PrimaryStaff: $scope.form.PrimaryStaff.Primary
        };
        if ($scope.form.SecondaryStaff) {
            dataObject.SecondaryStaff = $scope.form.SecondaryStaff.Primary;
        }
        var sd = $scope.form.StartDate.split('/').join('-');
        var responsePromise = $http.put("/api/applications/" + $routeParams.appName + "/segments/" + sd, dataObject, {});
        responsePromise.success(function (data, status) {
            $route.reload();
        });
        responsePromise.error(function (data, status) {
            alert(data.Message);
        });
    };

    $scope.getStaffString = function(staff) {
        return staff.Name + " - " + staff.Primary;
    }
}

function historyCtrl($scope, $http, $routeParams) {
    var segmentEditHistory;

    $http.get('/api/applications/' + $routeParams.appName + '/history').
    success(function (data, status) {
        $scope.status = status;
        $scope.history = data.results.SegmentEditHistory;
        segmentEditHistory = data.results.SegmentEditHistory;
        segmentEditHistory.forEach(function(record) {
            record.EditDateOnly = moment(record.EditDate).format("MM/DD/YYYY");
            record.EditTimeOnly = moment(record.EditDate).format("h:mm:ss a");
            record.ActionDescription = record.Action + " by " + record.Editor;
            record.StartDate = moment(record.StartDate).format("MM/DD/YYYY");
            record.EndDate = moment(record.EndDate).format("MM/DD/YYYY");
        })
    }).
    error(function (data, status) {
        $scope.app = data.results || "Request failed";
        $scope.status = status;
    });
}

function timeSpentCtrl($scope, $http, $routeParams) {
    var staffMembers;

    $http.get('/api/applications/' + $routeParams.appName + '/timeSpent').
    success(function (data, status) {
        $scope.status = status;
        $scope.staffMembers = data.results;
        staffMembers = data.results;

        $scope.chartObject = {};

        $scope.chartObject.data = {"cols": [
            {id: "t", label: "Topping", type: "string"},
            {id: "s", label: "Minutes On Call", type: "number"}
        ], "rows": [
            {c: [
                {v: "Brian Dill"},
                {v: 16}
            ]},
            {c: [
                {v: "Scott Barstow"},
                {v: 10}
            ]},
            {c: [
                {v: "Jeff Jagoda"},
                {v: 1}
            ]},
            {c: [
                {v: "Call-O-Tron"},
                {v: 45}
            ]}
        ]};

        // $routeParams.chartType == BarChart or PieChart or ColumnChart...
        $scope.chartObject.type = 'BarChart';
        $scope.chartObject.options = {
            'title': 'Time On Call (in minutes)'
        }
    }).
    error(function (data, status) {
        $scope.app = data.results || "Request failed";
        $scope.status = status;
    });
}

function currentSegment(segments, callback) {
    var today = new moment().utc().hour(0).minute(0).second(0).millisecond(0);
    var foundSegment = null;
    var err;
    segments.forEach(function (segment) {
        var currStartDate = new moment(segment.StartDate).utc().hour(0).minute(0).second(0).millisecond(0);
        var currEndDate = new moment(segment.EndDate).utc().hour(0).minute(0).second(0).millisecond(0);
        // Is it between the start and end date of the segment or is it the start or end date?
        if ((currStartDate.isBefore(today) && currEndDate.isAfter(today)) || (currStartDate.isSame(today) || currEndDate.isSame(today))) {
            foundSegment = segment;
        }
    });
    if (!foundSegment) {
        err = new Error("No current segment found.");
    }
    callback(err, foundSegment);

};

function findSecondary(segments, callback) {
    currentSegment(segments, function (err, doc) {
        if (doc){
            callback(doc.SecondaryStaff);
        } else {
            callback(null);
        }
    });
};


function findPrimary(segments, callback) {
    currentSegment(segments, function (err, doc) {
        if (doc){
            callback(doc.PrimaryStaff);
        } else {
            callback(null);
        }
    });
};