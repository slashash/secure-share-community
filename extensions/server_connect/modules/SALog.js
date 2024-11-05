exports.CreateLog = async function (options) {
  options.ip_address = '{{$_SERVER.REMOTE_ADDR}}';
  let data = this.parseOptional(options.response, '*', null);
  let status = this.parseOptional(options.status, 'number', 200);
  options = this.parse(options);

  //creating connecting using connection string 
  const connection = this.parseRequired(options.connection, 'string', 'connection is required.');
  const db = this.getDbConnection(connection);
  if (!db) throw new Error(`Connection "${connection}" doesn't exist.`);

  // check if mode is insert type
  //checking if session already exists
  if (!this.req.session[options.sessionGUID]) {
    this.req.session[options.sessionGUID] = [];
  }

  var logs = [];
  // checking if session is empty
  if (this.req.session[options.sessionGUID].length > 0)
    logs = this.req.session[options.sessionGUID];

  // pushing new log to logs array
  logs.push(options);

  // assigning back logs array to session object. 
  this.req.session[options.sessionGUID] = logs;

  if (options.logMode == true) {
    // creating bulk insert query
    try {
      var logs = this.req.session[options.sessionGUID].reverse();
      delete this.req.session[options.sessionGUID];
      let arrInsert = [];

      for (let i = 0; i < logs.length; i++) {
        arrInsert.push(
          {
            "api": logs[i].serverActionName == '' ? null : logs[i].serverActionName ?? null,
            "request_url": logs[i].requestURL == '' ? null : logs[i].requestURL ?? null,
            "called_by": logs[i].userIdentity == '' ? null : logs[i].userIdentity ?? null,
            "input_params": logs[i].inputParams == '' ? null : JSON.stringify(logs[i].inputParams) ?? null,
            "output_params": logs[i].outputParams == '' ? null : JSON.stringify(logs[i].outputParams) ?? null,
            "error": logs[i].errors == '' ? null : JSON.stringify(logs[i].errors) ?? null,
            "remarks": logs[i].remarks == '' ? null : JSON.stringify(logs[i].remarks) ?? null,
            "started_on": logs[i].startedOn,
            "completed_on": logs[i].completedOn,
            "ip": logs[i].ip_address == '' ? null : logs[i].ip_address ?? null
          });
      }

      result = await db('t_log').insert(arrInsert, ['id']);
    }
    catch (err) {
      result = await db('t_log').insert({
        "api": options.serverActionName == '' ? null : options.serverActionName ?? null,
        "request_url": options.requestURL == '' ? null : options.requestURL ?? null,
        "called_by": options.userIdentity == '' ? null : options.userIdentity ?? null,
        "error": JSON.stringify(err) ?? null,
        "remarks": "Log Creation Error",
        "started_on": options.startedOn,
        "completed_on": this.parse("{{NOW_UTC.formatDate('yyyy-MM-dd HH:mm:ss')}}"),
        "ip": options.ip_address == '' ? null : options.ip_address ?? null
      }, ['id']);
    }
  }

  if (options.status) {
    if (status == 200)
      this.res.status(status).send({});
    else
      this.res.status(status).send(data);
  }
}