$(function () {
    // PWA
    'use strict';
    var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
        // [::1] is the IPv6 localhost address.
        window.location.hostname === '[::1]' ||
        // 127.0.0.1/8 is considered localhost for IPv4.
        window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        )
    );

    if ('serviceWorker' in navigator &&
        (window.location.protocol === 'https:' || isLocalhost)) {
        navigator.serviceWorker.register('service-worker.js')
            .then(function (registration) {
                // updatefound is fired if service-worker.js changes.
                registration.onupdatefound = function () {
                    // updatefound is also fired the very first time the SW is installed,
                    // and there's no need to prompt for a reload at that point.
                    // So check here to see if the page is already controlled,
                    // i.e. whether there's an existing service worker.
                    if (navigator.serviceWorker.controller) {
                        // The updatefound event implies that registration.installing is set:
                        // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
                        var installingWorker = registration.installing;

                        installingWorker.onstatechange = function () {
                            switch (installingWorker.state) {
                                case 'installed':
                                    // At this point, the old content will have been purged and the
                                    // fresh content will have been added to the cache.
                                    // It's the perfect time to display a "New content is
                                    // available; please refresh." message in the page's interface.
                                    break;

                                case 'redundant':
                                    throw new Error('The installing ' +
                                        'service worker became redundant.');

                                default:
                                // Ignore
                            }
                        };
                    }
                };
            }).catch(function (e) {
                console.error('Error during service worker registration:', e);
            });
    }
    // !PWA
    // Your custom JavaScript departes here
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyDtyW1HxS-RUks5OO4libOtRJ6mx6i5jkk",
        authDomain: "firetrip-813c6.firebaseapp.com",
        databaseURL: "https://firetrip-813c6.firebaseio.com",
        projectId: "firetrip-813c6",
        storageBucket: "",
        messagingSenderId: "182738158107"
    };
    firebase.initializeApp(config);

    //リアルタイム通信の準備
    var newPostRef = firebase.database().ref();
    var articleRef = firebase.database().ref('/articles');
    // 概要と詳細の状態判定用
    var showStatus = 0;
    // 編集判別要変数
    var editStatus = 0;
    // 旅のkey格納
    var show_id;
    var index;
    // var records_no = 0;
    // 順番用の配列
    // var recordsNo = [];
    // firebase読み込み用
    var query;
    // 旅行選択時の配列保持用
    var nowRecord = 0;

    // 要素取得用
    // 旅入力関係
    var $title = $('#title');
    var $depart = $('#depart');
    var $arrive = $('#arrive');
    var $cost = $('#cost');
    var $about = $('#about');
    // record入力関係
    var $fromTime = $('#fromTime');
    var $from = $('#from');
    var $toTime = $('#toTime');
    var $to = $('#to');
    var $how = $('#how');
    var $comment = $('#comment');

    var press = 0;

    // 日付設定用関数
    function addDate() {
        var today = new Date();
        today.setDate(today.getDate());
        var yyyy = today.getFullYear();
        var mm = ("0" + (today.getMonth() + 1)).slice(-2);
        var dd = ("0" + today.getDate()).slice(-2);
        $('#depart').val(yyyy + '-' + mm + '-' + dd);
        $('#arrive').val(yyyy + '-' + mm + '-' + dd);
    }

    // 時間を設定する関数
    function addTime() {
        var today = new Date();
        today.setDate(today.getDate());
        // var yyyy = today.getFullYear();
        var hh = ("0" + (today.getHours())).slice(-2);
        var mm = ("0" + today.getMinutes()).slice(-2);
        $('#fromTime').val(hh + ':' + mm);
        $('#toTime').val(hh + ':' + mm);
    }

    // 旅要素からidを取得する関数
    function getUid(target) {
        // 親の親のidを取得して返す
        var id = $(target).parent().parent().parent().attr("id");
        return id;
    }
    // record要素からid(インデックス)を取得する関数
    // 配列を追加してJSONにする関数
    function push_JSON(arr, ft, f, tt, t, h, c) {
        arr.push({
            "fromTime": ft,
            "from": f,
            "toTime": tt,
            "to": t,
            "how": h,
            "comment": c
        });
        var j = JSON.stringify(arr);
        return j;
    }

    // 旅を表示する関数
    function articleShow() {
        articleRef.on('value', function (snapshot) {
            var str = "";
            snapshot.forEach(function (child) {
                // ↓ユニークキー取得
                var k = child.key;
                // ↓データ取得
                var v = child.val();
                // メッセージ表示
                var append_doms = "";
                append_doms = `<div class="card mb-3 article_card" id="${k}">
                                    <div class="card-header">
                                        <h2 class="card-title title keyword">${v.title}</h2>
                                        <div class="card-text"><i class="material-icons">flight_takeoff</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="depart">${v.depart}</div></div>
                                        <div class="card-text"><i class="material-icons">flight_land</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="arrive">${v.arrive}</div></div>
                                    </div>
                                    <div class="card-block hidden">
                                        <div class="card-text"><i class="material-icons">attach_money</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="cost">${v.cost}</div></div>
                                        <div class="card-text keyword text_wrap"><i class="material-icons">comment</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="comment_block about">${v.about}</div></div>
                                        <div>
                                            <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block show_details">Show Details</button>
                                        </div>
                                        <div class="flex">
                                            <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block a_edit disable"><i class="material-icons">edit</i></button>
                                            <button type="button" class="btn btn-secondary mt-2 btn-block a_delete disable"><i class="material-icons">delete</i></button>
                                        </div>
                                    </div>
                                </div>`;
                str = str + append_doms;
            });
            // ↓表示処理
            $('#articles').html(str);
            // 旅は日付順で並ぶように
            var $arr = $('.article_card').sort(function (a, b) {
                return ($(a).find('.depart').text() < $(b).find('.depart').text() ? 1 : -1);  //ソート条件
            });
            // 変更した並び順で表示
            $('#articles').html($arr);
        });
        // ユニークIDを初期化
        show_id = 0;
        nowRecord = 0;
        // sendボタンの挙動
        $('#input').find('.a_send').prop('disabled', true);
        // 表示
        $('#output').hide().fadeIn(750);
        $('#add_trip').removeClass('hidden');
        $('#articles').removeClass('hidden');
        $('#records').addClass('hidden');
        $('#add_records').addClass('hidden');
    }

    // recordを表示する関数
    function recordShow() {
        // ユニークIDとレコード数を取得
        var r;
        articleRef.child(show_id).on('value', function (snapshot) {
            r = snapshot.val().records;
            nowRecord = JSON.parse(r);
        });
        var str = "";
        var append_doms = "";
        for (let i in nowRecord) {
            // console.log(nowRecord[i]);
            append_doms = `<div class="card mb-3" id="${i}">
                                    <div class="card-header">
                                        <div class="flex">
                                            <h2 class="fromTime">${nowRecord[i].fromTime}</h2>
                                            <h2 class="card-text from">${nowRecord[i].from}</h2>
                                        </div>
                                        <div class="flex margin">
                                            <p class="card-text">|</p>
                                            <p class="card-text how">${nowRecord[i].how}</p>
                                        </div>
                                        <div class="flex">
                                            <h2 class="toTime">${nowRecord[i].toTime}</h2>
                                            <h2 class="card-text to">${nowRecord[i].to}</h2>
                                        </div>
                                    </div>
                                    <div class="card-block hidden">
                                        <div class="card-text keyword text_wrap"><i class="material-icons">comment</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="comment_block comment">${nowRecord[i].comment}</div></div>
                                        <div class="flex">
                                            <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block  r_edit disable"><i class="material-icons">edit</i></button>
                                            <button type="button" class="btn btn-secondary mt-2 btn-block  r_delete disable"><i class="material-icons">delete</i></button>
                                        </div>
                                    </div>
                                </div>`;
            str = str + append_doms;
        }
        $('#records').html(str);
        // sendボタンの挙動
        $('#input').find('.r_send').prop('disabled', true);
        // 表示
        $('#output').hide().fadeIn(750);
        $('#articles').addClass('hidden');
        $('#add_trip').addClass('hidden');
        $('#records').removeClass('hidden');
        $('#add_records').removeClass('hidden');
    }

    // 読み込み時にやること
    // 最初の画面表示
    // $('#loading_start').fadeOut(750);
    // $('#loading_end').fadeIn(750);
    // 日付設定
    addDate();
    // 時間設定
    addTime();
    // firebaseデータの読み込み
    articleShow();


    // 以下，データ登録・表示関連

    // データ追加時に日時と時間を合わせる
    $('#add').on('click', function () {
        addDate();
        addTime();
    });

    // 詳細ボタン押下でrecordの表示を切り替え
    $('#output').on('click', '.show_details', function () {
        editStatus = 0;
        showStatus = 1;
        show_id = getUid(this);
        recordShow();
        // alert(showStatus);
    });

    // トップロゴ押下で旅の表示を切り替え
    $('#back_top').on('click', function () {
        editStatus = 0;
        showStatus = 0;
        articleShow();
        // alert(showStatus);
    });

    // 旅データ追加登録
    $('#input').on('click', '.a_send', function () {
        articleRef.push({
            title: $title.val(),
            depart: $depart.val(),
            arrive: $arrive.val(),
            cost: $cost.val(),
            about: $about.val().split('\n').join('<br>'),
            records: "[]",
            user: ""
        });
        // 入力欄を空白に戻す
        $title.val("");
        $cost.val("10000");
        $about.val("");
        articleShow();
    });

    // recordデータ追加登録
    $('#input').on('click', '.r_send', function () {
        var json_r = push_JSON(nowRecord, $fromTime.val(), $from.val(), $toTime.val(), $to.val(), $how.val(), $comment.val());
        // jsonを追加
        var editRef = firebase.database().ref("/articles/" + show_id);
        editRef.update({
            records: json_r
        });
        // 入力欄を空白に戻す
        $from.val("");
        $to.val("");
        $how.val("");
        $comment.val("");
        recordShow();

        // 送信ボタン無効化
        $('#input').find('.send').prop('disabled', true);
        // モーダル閉じる
        $('body').removeClass('modal-open');
        $('.modal-arrivedrop').remove();
        $('#input').modal('hide');
    });

    // 入力時に必須項目未入力時はsendボタン無効化
    $('#input').on('keyup', '#title, #from, #to, #how', function () {
        if (showStatus == 0) {
            // 旅登録時はタイトル必須
            if ($title.val() == "") {
                $('#input').find('.a_send').prop('disabled', true);
            } else {
                $('#input').find('.a_send').prop('disabled', false);
            }
        } else if (showStatus == 1) {
            // record登録時は出発地到着地手段必須
            if ($from.val() == "" || $to.val() == "" || $how.val() == "") {
                $('#input').find('.r_send').prop('disabled', true);
            } else {
                $('#input').find('.r_send').prop('disabled', false);
            }
        }
    });

    // 編集時に必須項目未入力時はsendボタン無効化
    $('#output').on('keyup', '#title_edit, #from_edit, #to_edit, #how_edit', function () {
        if (showStatus == 0) {
            if ($('#title_edit').val() == "") {
                $('.a_set').prop('disabled', true);
            } else {
                $('.a_set').prop('disabled', false);
            }
        } else if (showStatus == 1) {
            // record登録時は出発地到着地手段必須
            if ($('#from_edit').val() == "" || $('#to_edit').val() == "" || $('#how_edit').val() == "") {
                $('.r_set').prop('disabled', true);
            } else {
                $('.r_set').prop('disabled', false);
            }

        }
    });

    // 旅編集
    $('#output').on('click', '.a_edit', function () {
        editStatus = 1;
        show_id = getUid(this);
        var title = $('#' + show_id).find('.title').text();
        var depart = $('#' + show_id).find('.depart').text();
        var arrive = $('#' + show_id).find('.arrive').text();
        var cost = $('#' + show_id).find('.cost').text();
        var about = $('#' + show_id).find('.about').html();
        var editabout = about.split('<br>').join('\n');
        var str =
            `<div class="card-header">
                        <h2 class="card-title title keyword">
                            <input type="text" id="title_edit" class="form-control" value="${title}"/>
                        </h2>
                        <div class="card-text"><i class="material-icons">flight_takeoff</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="depart">
                            <input type="date" id="depart_edit" class="form-control" value="${depart}"/>
                        </div></div>
                        <div class="card-text"><i class="material-icons">flight_land</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="arrive">
                            <input type="date" id="arrive_edit" class="form-control" value="${arrive}"/>
                        </div></div>
                    </div>
                    <div class="card-block">
                        <div class="card-text"><i class="material-icons">attach_money</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="cost">
                            <select id="cost_edit" class="form-control">
                                <option value="10000">10000</option>
                                <option value="20000">20000</option>
                                <option value="30000">30000</option>
                                <option value="40000">40000</option>
                                <option value="50000">50000</option>
                            </select>
                        </div></div>
                        <div class="card-text keyword text_wrap"><i class="material-icons">comment</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="comment_block about">
                            <textarea rows="3" id="text_edit" class="form-control">${editabout}</textarea>
                        </div></div>
                        <div>
                            <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block show_details">Show Details</button>
                        </div>
                        <div class="flex">
                            <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block a_cancel disable"><i class="material-icons">arrow_back</i></button>
                            <button type="button" class="btn btn-primary mt-2 btn-block a_set disable"><i class="material-icons">done</i></button>
                        </div>
                    </div>`;


        $('#' + show_id).html(str);
        $('#cost_edit').val(cost);
        $('nav button').prop('disabled', true);
        $('#add, .show_details, .a_edit, .a_delete').prop('disabled', true);

        // キャンセルで戻す
        $('#output').on('click', '.a_cancel', function () {
            var str =
                `<div class="card-header">
                    <h2 class="card-title title keyword">${title}</h2>
                    <div class="card-text"><i class="material-icons">flight_takeoff</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="depart">${depart}</div></div>
                    <div class="card-text"><i class="material-icons">flight_land</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="arrive">${arrive}</div></div>
                </div>
                <div class="card-block">
                    <div class="card-text"><i class="material-icons">attach_money</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="cost">${cost}</div></div>
                    <div class="card-text keyword text_wrap"><i class="material-icons">comment</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="comment_block about">${about}</div></div>
                    <div>
                        <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block show_details">Show Details</button>
                    </div>
                    <div class="flex">
                        <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block a_edit disable"><i class="material-icons">edit</i></button>
                        <button type="button" class="btn btn-secondary mt-2 btn-block a_delete disable"><i class="material-icons">delete</i></button>
                    </div>
                </div>`;

            $('#' + show_id).html(str);
            $('nav button').prop('disabled', false);
            $('#add, .show_details, .a_edit, .a_delete').prop('disabled', false);
            editStatus = 0;
        });
    });

    // 旅編集決定
    $('#output').on('click', '.a_set', function () {
        // 各値を入力した値に変更
        var title = $('#title_edit').val();
        var depart = $('#depart_edit').val();
        var arrive = $('#arrive_edit').val();
        var cost = $('#cost_edit').val();
        var about = $('#text_edit').val().split('\n').join('<br>');
        // 更新する場所を指定
        // var id = getUid(this);
        var editRef = firebase.database().ref("/articles/" + show_id);
        // console.log("articleEdit", title, depart, arrive, cost, about, show_id);
        // 現在のユニークキー箇所を更新するバージョン
        editRef.update({
            title: title,
            depart: depart,
            arrive: arrive,
            cost: cost,
            about: about
        });
        var str =
            `<div class="card-header">
                    <h2 class="card-title title keyword">${title}</h2>
                    <div class="card-text"><i class="material-icons">flight_takeoff</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="depart">${depart}</div></div>
                    <div class="card-text"><i class="material-icons">flight_land</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="arrive">${arrive}</div></div>
                </div>
                <div class="card-block">
                    <div class="card-text"><i class="material-icons">attach_money</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="cost">${cost}</div></div>
                    <div class="card-text keyword text_wrap"><i class="material-icons">comment</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="comment_block about">${about}</div></div>
                    <div>
                        <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block show_details">Show Details</button>
                    </div>
                    <div class="flex">
                        <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block a_edit disable"><i class="material-icons">edit</i></button>
                        <button type="button" class="btn btn-secondary mt-2 btn-block a_delete disable"><i class="material-icons">delete</i></button>
                    </div>
                </div>`;
        $('#' + show_id).html(str);
        // $('.show_details').removeClass('hidden');
        $('nav button').prop('disabled', false);
        $('#add, .show_details, .a_edit, .a_delete').prop('disabled', false);
        editStatus = 0;
    });

    // record編集
    $('#output').on('click', '.r_edit', function () {
        editStatus = 1;
        index = getUid(this);
        // console.log("recordEditId", index);
        var fromTime = $('#' + index).find('.fromTime').text();
        var from = $('#' + index).find('.from').text();
        var toTime = $('#' + index).find('.toTime').text();
        var to = $('#' + index).find('.to').text();
        var how = $('#' + index).find('.how').text();
        var comment = $('#' + index).find('.comment').html();
        var editcomment = comment.split('<br>').join('\n');
        // var str =
        //     `< div class="card-header" >
        //         <h2 class="card-title title keyword">${index}</h2>
        //             </div >
        //         <div class="card-block">
        //             <div class="card-text">fromTime</div>
        //             <div class="card-text fromTime">
        //                 <input type="time" id="fromTime_edit" class="form-control" value="${fromTime}" />
        //             </div>
        //             <div class="card-text">from</div>
        //             <div class="card-text from">
        //                 <input type="text" id="from_edit" class="form-control" value="${from}" />
        //             </div>
        //             <div class="card-text">toTime</div>
        //             <div class="card-text toTime">
        //                 <input type="time" id="toTime_edit" class="form-control" value="${toTime}" />
        //             </div>
        //             <div class="card-text">to</div>
        //             <div class="card-text to">
        //                 <input type="text" id="to_edit" class="form-control" value="${to}" />
        //             </div>
        //             <div class="card-text">how</div>
        //             <div class="card-text how">
        //                 <input type="text" id="how_edit" class="form-control" value="${how}" />
        //             </div>
        //             <div class="card-text">comment</div>
        //             <div class="card-text comment keyword">
        //                 <textarea rows="3" id="comment_edit" class="form-control">${editcomment}</textarea>
        //             </div>
        //             <div class="flex">
        //                 <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block r_cancel disable"><i class="material-icons">arrow_back</i></button>
        //                 <button type="button" class="btn btn-primary mt-2 btn-block r_set disable"><i class="material-icons">done</i></button>
        //             </div>
        //         </div>`;
        var str =
            `<div class="card-header">
                    <div class="flex">
                        <input type="time" id="fromTime_edit" class="form-control" value="${fromTime}" />
                        <input type="text" id="from_edit" class="form-control" value="${from}" />
                    </div>
                    <div class="flex margin">
                        <p class="card-text">|</p>
                        <input type="text" id="how_edit" class="form-control" value="${how}" />
                    </div>
                    <div class="flex">
                        <input type="time" id="toTime_edit" class="form-control" value="${toTime}" />
                        <input type="text" id="to_edit" class="form-control" value="${to}" />
                    </div>
                </div>
                <div class="card-block">
                    <div class="card-text keyword text_wrap"><i class="material-icons">comment</i>&nbsp;&nbsp;&nbsp;&nbsp;<textarea rows="3" id="comment_edit" class="form-control">${editcomment}</textarea></div>
                    <div class="flex">
                        <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block r_cancel disable"><i class="material-icons">arrow_back</i></button>
                        <button type="button" class="btn btn-primary mt-2 btn-block r_set disable"><i class="material-icons">done</i></button>
                    </div>
                </div>`;
        $('#' + index).html(str);
        $('nav button').prop('disabled', true);
        $('#add, #send, .show_details, .r_edit, .r_delete').prop('disabled', true);

        // キャンセル
        $('#output').on('click', '.r_cancel', function () {
            var str =
                `<div class="card-header">
                    <div class="flex">
                        <h2 class="fromTime">${fromTime}</h2>
                        <h2 class="card-text from">${from}</h2>
                    </div>
                    <div class="flex margin">
                        <p class="card-text">|</p>
                        <p class="card-text how">${how}</p>
                    </div>
                    <div class="flex">
                        <h2 class="toTime">${toTime}</h2>
                        <h2 class="card-text to">${to}</h2>
                    </div>
                </div>
                <div class="card-block">
                    <div class="card-text keyword text_wrap"><i class="material-icons">comment</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="comment_block comment">${comment}</div></div>
                    <div class="flex">
                        <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block  r_edit disable"><i class="material-icons">edit</i></button>
                        <button type="button" class="btn btn-secondary mt-2 btn-block  r_delete disable"><i class="material-icons">delete</i></button>
                    </div>
                </div>`;
            // `< div class="card-header" >
            // <h2 class="card-title title keyword">${index}</h2>
            //         </div >
            // <div class="card-block">
            //     <div class="card-text">fromTime</div>
            //     <div class="card-text fromTime">${fromTime}</div>
            //     <div class="card-text">from</div>
            //     <div class="card-text from">${from}</div>
            //     <div class="card-text">toTime</div>
            //     <div class="card-text toTime">${toTime}</div>
            //     <div class="card-text">to</div>
            //     <div class="card-text to">${to}</div>
            //     <div class="card-text">how</div>
            //     <div class="card-text how">${how}</div>
            //     <div class="card-text">comment</div>
            //     <div class="card-text comment keyword">${comment}</div>
            //     <div class="flex">
            //         <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block r_edit disable"><i class="material-icons">edit</i></button>
            //         <button type="button" class="btn btn-secondary mt-2 btn-block r_delete disable"><i class="material-icons">delete</i></button>
            //     </div>
            // </div>`;
            $('#' + index).html(str);
            $('nav button').prop('disabled', false);
            $('#add, .show_details, .r_edit, .r_delete').prop('disabled', false);
            editStatus = 0;
        });
    });

    // record編集決定
    $('#output').on('click', '.r_set', function () {
        var fromTime = $('#fromTime_edit').val();
        var from = $('#from_edit').val();
        var toTime = $('#toTime_edit').val();
        var to = $('#to_edit').val();
        var how = $('#how_edit').val();
        var comment = $('#comment_edit').val().split('\n').join('<br>');
        // console.log(fromTime, from, toTime, to, how, comment);
        // 更新するインデックスを指定して更新
        // index = getUid(this);
        // console.log("決定時のindex", index);
        nowRecord[index] = {
            "fromTime": fromTime,
            "from": from,
            "toTime": toTime,
            "to": to,
            "how": how,
            "comment": comment
        };
        // console.log(nowRecord[index])
        // jsonに変換
        var json_r;
        json_r = JSON.stringify(nowRecord);
        // console.log(json_r);
        // console.log("record記録時の旅のID", show_id);
        // console.log("record記録時のrecordのindex", index);
        // jsonを追加
        var editRef = firebase.database().ref("/articles/" + show_id);
        editRef.update({
            records: json_r
        });
        var str =
            `<div class="card-header">
                    <div class="flex">
                        <h2 class="fromTime">${fromTime}</h2>
                        <h2 class="card-text from">${from}</h2>
                    </div>
                    <div class="flex margin">
                        <p class="card-text">|</p>
                        <p class="card-text how">${how}</p>
                    </div>
                    <div class="flex">
                        <h2 class="toTime">${toTime}</h2>
                        <h2 class="card-text to">${to}</h2>
                    </div>
                </div>
                <div class="card-block">
                    <div class="card-text keyword text_wrap"><i class="material-icons">comment</i>&nbsp;&nbsp;&nbsp;&nbsp;<div class="comment_block comment">${comment}</div></div>
                    <div class="flex">
                        <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block  r_edit disable"><i class="material-icons">edit</i></button>
                        <button type="button" class="btn btn-secondary mt-2 btn-block  r_delete disable"><i class="material-icons">delete</i></button>
                    </div>
                </div>`;
        // `< div class="card-header" >
        //     <h2 class="card-title title keyword">${index}</h2>
        //     </div >
        //     <div class="card-block">
        //         <div class="card-text">fromTime</div>
        //         <div class="card-text fromTime">${fromTime}</div>
        //         <div class="card-text">from</div>
        //         <div class="card-text from">${from}</div>
        //         <div class="card-text">toTime</div>
        //         <div class="card-text toTime">${toTime}</div>
        //         <div class="card-text">to</div>
        //         <div class="card-text to">${to}</div>
        //         <div class="card-text">how</div>
        //         <div class="card-text how">${how}</div>
        //         <div class="card-text">comment</div>
        //         <div class="card-text comment keyword">${comment}</div>
        //         <div class="flex">
        //             <button type="button" class="btn btn-secondary mt-2 mr-2 btn-block r_edit disable"><i class="material-icons">edit</i></button>
        //             <button type="button" class="btn btn-secondary mt-2 btn-block r_delete disable"><i class="material-icons">delete</i></button>
        //         </div>
        //     </div>`;
        $('#' + index).html(str);
        $('nav button').prop('disabled', false);
        $('#add, .show_details, .r_edit, .r_delete').prop('disabled', false);
        editStatus = 0;
    });

    // 旅削除
    $('#output').on('click', '.a_delete', function () {
        if (!confirm('本当に削除しますか?')) {
            return false;
        } else {
            // 削除時の挙動
            // id(ユニークキー)を取得
            show_id = getUid(this);
            // 旅の削除
            articleRef.child(show_id).remove();
            articleShow();
        }
        // editStatus = 0;
    });

    // record削除
    $('#output').on('click', '.r_delete', function () {
        if (!confirm('本当に削除しますか?')) {
            return false;
        } else {
            // 削除時の挙動
            // 配列のインデックスを取得
            var index = getUid(this);
            // var id = $(this).parent().parent().attr('id');
            // 該当するインデックスの値を削除
            nowRecord.splice(index, 1);
            // jsonに変換
            var json_r;
            json_r = JSON.stringify(nowRecord);
            // jsonを追加
            var editRef = firebase.database().ref("/articles/" + show_id);
            editRef.update({
                records: json_r
            });
            // 表示
            recordShow();
        }
        // editStatus = 0;
    });


    // 検索用の関数
    var searchTitle = function () {
        var searchText = $('#search-text').val(), // 検索ボックスに入力された値
            targetText;
        // 全角スペースを半角スペースに置換
        searchText = searchText.replace(/　/gi, ' ');
        // 半角配列に入れるで区切って配列化
        var searchArr = searchText.split(" ");
        if ($("[name=search]:checked").val() == "title") {
            $('.title').each(function () {
                targetText = $(this).text();
                // 検索対象となるリストに入力された文字列が存在するかどうかを判断
                if (targetText.indexOf(searchText) != -1) {
                    $(this).parent().parent().removeClass('hidden');
                } else {
                    $(this).parent().parent().addClass('hidden');
                }
            });
        } else {
            $('.about').each(function () {
                targetText = $(this).text();
                // 検索対象となるリストに入力された文字列が存在するかどうかを判断
                if (targetText.indexOf(searchText) != -1) {
                    $(this).parent().parent().parent().removeClass('hidden');
                } else {
                    $(this).parent().parent().parent().addClass('hidden');
                }
            });
        }
    };
    // 入力かラジオボタン操作で検索
    $('#search-text').on('keyup', searchTitle);
    $('input[name="search"]:radio').on('click', searchTitle);
    // 編集とかしたときに検索した状態を保存したい
    $('#output').on('click', '.set', searchTitle);



    // 並び替え関連
    // $('#records').addMouseHold(function () {
    //     press = 1;
    // console.log(press);
    // });
    // $('#records').hammer().on('press', function () {

    // });

    // if (press == 1) {
    $('#records').sortable({
        axis: 'y',
        update: function () {
            // 並び替え後のデータを入れる配列
            var newRecord = [];
            // 並び替えた順番を配列に保存
            var log = $(this).sortable("toArray");
            // 新しい配列に順番に入れる
            for (var i = 0; i < log.length; i++) {
                newRecord.push(nowRecord[log[i]]);
            }
            // JOSNにして保存
            var json_r = JSON.stringify(newRecord);
            var editRef = firebase.database().ref("/articles/" + show_id);
            editRef.update({
                records: json_r
            });
            // 再読込
            recordShow();
        }
    });
    // }




    // タイトルクリックで詳細表示
    $('#output').on('click', '.card-header', function () {
        if (editStatus == 0) {
            var id = $(this).parent().attr("id");
            $('#' + id).find('.card-block').slideToggle();
        }
    });

    // textareaの自動リサイズ
    $('textarea').each(function () {
        $(this).css({
            'overflow': 'hidden',
            'resize': 'none'
        })
            .data('original_row', $(this).attr('rows'));
    });
    $('textarea').bind('keyup', function () {
        var self = this;
        var value = $(this).val().split("\n");
        var value_row = 0;
        $.each(value, function (i, val) {
            value_row += Math.max(Math.ceil(val.length / self.cols), 1);
        });
        var input_row = $(this).attr('rows');
        var original_row = $(this).data('original_row');
        var next_row = (input_row <= value_row) ? value_row + 1 : Math.max(value_row + 1, original_row);
        $(this).attr('rows', next_row);
    });

});
