(function() {
	/**
	 * Query to identify the latest safe timestamp to use as a delta token.
	 * If there are currently running writing transactions, the start time of
	 * the last started transaction is used, otherwise the current time. The
	 * time is converted to UTC by looking up the current time zone in
	 * M_HOST_INFORMATION. This is safe since according to
	 * http://scn.sap.com/community/hana-in-memory/blog/2014/02/19/you-got-the-time
	 * the time zone for each server node has to be the same, should there be
	 * multiple nodes.
	 *
	 * Note, the DELTA_TOKEN_QUERY is fetching a non-UTC value.
	 * However resultSet.getTimestamp(1) is time-zone aware and interprets
	 * this value as local time.  cachedTime.getTime() is already in UTC
	 * without any explicit conversion needed.
	 */

	var DELTA_TOKEN_QUERY = 'SELECT IFNULL( MIN(START_TIME), NOW() ) AS DELTATOKEN ' +
		'FROM M_TRANSACTIONS ' +
		'WHERE UPPER( TRANSACTION_STATUS ) <> \'INACTIVE\' AND UPDATE_TRANSACTION_ID > 0';
	
	var cachedTime = null;
	
	if(!Date.latestSafeTimestamp) {
		/**
		 * Returns the latest date that would be safe to use as a delta token.
		 * 
		 * The return value of this method is cached per request.
		 * 
		 * @returns {Date} The latest safe date
		 */
		Date.latestSafeTimestamp = function() {
			if(cachedTime) return cachedTime;
			
			var resultSet = $.db.getConnection("sap.odata.util.lib.db::odataUtil")
				.prepareStatement(DELTA_TOKEN_QUERY)
				.executeQuery();
			
			resultSet.next();
			
			cachedTime = resultSet.getTimestamp(1);
			return cachedTime;
		};
	}
})();
