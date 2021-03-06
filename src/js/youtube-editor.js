(function () {
    'use strict';

    angular.module('youtubeEditor', ['ngDialog'])
        .factory('$youtubeEditor', ['ngDialog', '$timeout', '$notice', '$q', function ($dialog, $timeout, $notice, $q) {
            var youtubeEditor = {};

            youtubeEditor.show = function (videoURL, startTime, endTime, volume, cb) {
                $dialog.open({
                    template: '/static/bower_components/angular-youtube-editor/src/templates/youtube-editor.html',
                    controller: ['$scope', function ($scope) {
                        $scope.init = function () {
                            $scope.videoURL = videoURL || 'https://www.youtube.com/watch?v=QcIy9NiNbmo';
                            $scope.maxPlayerWidth = 854;
                            $scope.playerHeight = 480;

                            $scope.playerWidth = $scope.maxPlayerWidth;

                            $scope.video = {startTime: parseInt(startTime) || 0, endTime: parseInt(endTime) || -1, duration: 0, volume: volume || 100};
                            $scope.loaded = false;
                            $scope.$watch('playerWidth', $scope.setDialogWidth);

                            $scope.$watch('video', $scope.updatePlayer, true);

                            $timeout(function () {
                                $(".dragger").draggable({
                                    axis: "x",
                                    containment: "parent",
                                    scroll: false,
                                    cursor: "ew-resize",
                                    start: function () { $timeout(function () {$scope.dragging = true})},
                                    stop: function () { $timeout(function () { $scope.dragging = false;})},
                                    drag: $scope.onDrag
                                });
                            }, 1000);

                            $(window).resize($scope.checkPlayerWidth);
                            $scope.checkPlayerWidth();
                            $scope.loadPlayer();
                        };

                        $scope.checkPlayerWidth = function () {
                            $timeout(function () {
                                var winWidth = $(window).width();
                                $scope.playerWidth = Math.min(winWidth - 40, $scope.maxPlayerWidth);
                            });
                        };

                        $scope.setDialogWidth = function () {
                            var dialog = $('div.ngdialog-content');

                            if (dialog.length > 0) {
                                dialog.css('max-width', ($scope.playerWidth + 20) + 'px').css('width', ($scope.playerWidth + 20) + 'px');
                                $('#YTPlayer').css('width', $scope.playerWidth + 'px');

                                $timeout($scope.updatePlayer);
                            } else {
                                $timeout($scope.setDialogWidth, 1);
                            }
                        };

                        $scope.onDrag = function (event, ui) {
                            var inSeconds = Math.floor(( ui.position.left / ($scope.playerWidth || 1)) * $scope.video.duration);
                            var seekTo = 0;

                            if (event.target.id === 'startLine') {
                                $scope.video.startTime = seekTo = inSeconds;
                            } else {
                                $scope.video.endTime = inSeconds;
                                seekTo = Math.max(0, $scope.video.startTime, inSeconds - 2);
                            }

                            $timeout($scope.updatePlayer);
                            $timeout.cancel($scope.lastSeek);
                            $scope.lastSeek = $timeout(function () {
                                $scope.player.seekTo(seekTo);
                            }, 1000);
                        };

                        $scope.loadPlayer = function () {
                            $scope.loaded = false;

                            if (typeof(YT) !== 'undefined' && YT.loaded && $('#YTPlayer').length > 0) {
                                //debugger;
                                $scope.player = new YT.Player('YTPlayer', {
                                    height: $scope.playerHeight,
                                    width: $scope.playerWidth,
                                    videoId: $scope.getVideoIdFromURL($scope.videoURL),
                                    playerVars: {autoplay: 0, autohide: 0, controls: 1, showinfo: 0, rel: 0, loop: 0, enablejsapi: 1, iv_load_policy: 3, modestbranding: 1},
                                    events: {onReady: $scope.onPlayerReady, onStateChange: $scope.onPlayerStateChange}
                                });
                            } else {
                                $timeout($scope.loadPlayer, 100);
                            }
                        };

                        $scope.onPlayerReady = function (event) {
                            var duration = event.target.getDuration();
                            $scope.video.duration = duration > 0 ? duration : $scope.video.duration;
                            $scope.video.startTime = parseInt($scope.video.startTime) || 0;
                            $scope.video.endTime = $scope.video.endTime >= 0 ? $scope.video.endTime : $scope.video.duration;
                            $scope.loaded = true;

                            $timeout($scope.updatePlayer);
                        };

                        $scope.onPlayerStateChange = function (event) {
                            $scope.playing = event.data == YT.PlayerState.PLAYING;

                            $timeout($scope.updatePlayer);
                        };

                        $scope.updatePlayer = function () {
                            if ($scope.loaded && $scope.player && $scope.video.duration > 0) {
                                //var currentTime = $scope.player.getCurrentTime();

                                $scope.video.startTime = Math.max(0, Math.min($scope.video.startTime || 0, $scope.video.duration - 1));
                                $scope.video.endTime = Math.min(Math.max($scope.video.endTime || 0, ($scope.video.startTime || 0) + 1), $scope.video.duration);
                                $scope.video.length = Math.max(1, $scope.video.endTime - $scope.video.startTime);

                                $scope.startLine = Math.floor(( $scope.video.startTime / $scope.video.duration ) * $scope.playerWidth);
                                $scope.endLine = Math.floor(( $scope.video.endTime / $scope.video.duration ) * $scope.playerWidth);

                                $scope.player.setVolume($scope.video.volume);

                                $scope.currentTime = Math.floor($scope.player.getCurrentTime());
                                if (( $scope.currentTime < $scope.video.startTime ) || ( $scope.currentTime >= $scope.video.endTime )) {
                                    $scope.player.seekTo($scope.video.startTime);
                                } else if ($scope.playing) {
                                    $timeout($scope.updatePlayer, 500);
                                }
                            }
                        };

                        $scope.getVideoIdFromURL = function (url) {
                            var matches = url.match(/youtube\.com.*((?:\?|\&)v=|\/embed\/)(.{11})/);

                            return matches ? matches.pop(0) : url;
                        };

                        $scope.save = function () {
                            if (cb instanceof Function) {
                                cb($scope.video);
                            }

                            $scope.closeThisDialog();
                        };

                        $scope.init();
                    }],
                    preCloseCallback: function () {
                        $('#YTPlayer').html('');
                    }
                });
            };

            return youtubeEditor;
        }]);
})();
