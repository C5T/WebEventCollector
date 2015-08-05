# WebEventCollector

# Data drop server configuration

Nginx:

```
location /datadrop/v1 {
  rewrite /datadrop/v1/([A-Za-z0-9_]+) /log?CUSTOMER_ACCOUNT=$1 break;
  proxy_pass http://0.0.0.0:7777/log;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

The server itself:
```
$ Current/EventCollector
$ make
$ ./.current/example --port=7777 --tick_interval_ms=3600000 >>~/datadrop.txt 2>&1^C
```

Simple test:

```
$ curl https://secure.c5t.io/datadrop/v1
OK
$ curl https://secure.c5t.io/datadrop/v1?foo=bar
OK
$ curl https://secure.c5t.io/datadrop/v1/CLIENT1?foo=baz
OK
```

```
{"log_entry":{"t":1438742368158,"m":"GET","u":"/log","q":[],"b":"","f":""}}
{"log_entry":{"t":1438742371542,"m":"GET","u":"/log","q":[{"key":"foo","value":"bar"}],"b":"","f":""}}
{"log_entry":{"t":1438742378780,"m":"GET","u":"/log","q":[{"key":"CUSTOMER_ACCOUNT","value":"CLIENT1"},{"key":"foo","value":"baz"}],"b":"","f":""}}
```

Real test:

```
{"log_entry":{"t":1438742799070,"m":"POST","u":"/log","q":[{"key":"CUSTOMER_ACCOUNT","value":"TEST_ACCOUNT_ID"}],"b":"_t=1438742796919&t=event&ec=C5T&ea=Ex&fg=1&cid=14ef73227c5934-093cee5e4-2c044c73-15f900-14ef73227c76d8","f":""}}
{"log_entry":{"t":1438742799146,"m":"GET","u":"/log","q":[{"key":"CUSTOMER_ACCOUNT","value":"TEST_ACCOUNT_ID"},{"key":"_t","value":"1438742797123"},{"key":"cid","value":"14ef73227c5934-093cee5e4-2c044c73-15f900-14ef73227c76d8"},{"key":"ea","value":"En"},{"key":"ec","value":"C5T"},{"key":"fg","value":"1"},{"key":"t","value":"event"}],"b":"","f":""}}
{"log_entry":{"t":1438742799368,"m":"GET","u":"/log","q":[{"key":"CUSTOMER_ACCOUNT","value":"TEST_ACCOUNT_ID"},{"key":"_t","value":"1438742797123"},{"key":"cid","value":"14ef73227c5934-093cee5e4-2c044c73-15f900-14ef73227c76d8"},{"key":"ea","value":"Fg"},{"key":"ec","value":"C5T"},{"key":"fg","value":"1"},{"key":"t","value":"event"}],"b":"","f":""}}
{"log_entry":{"t":1438742800353,"m":"GET","u":"/log","q":[{"key":"CUSTOMER_ACCOUNT","value":"TEST_ACCOUNT_ID_2"},{"key":"_t","value":"1438742799987"},{"key":"cid","value":"14ef73227c5934-093cee5e4-2c044c73-15f900-14ef73227c76d8"},{"key":"ea","value":"Test Action"},{"key":"ec","value":"Test Category"},{"key":"fg","value":"1"},{"key":"t","value":"event"}],"b":"","f":""}}
```
