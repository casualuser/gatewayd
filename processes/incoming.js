var gateway = require(__dirname+'/../');

var Listener = require(__dirname+'/../lib/ripple/listener.js');

var listener = new Listener();

listener.onPayment = function(payment) {
  logger.info('payment:notification:received', payment);
  if (payment && payment.destination_account === gateway.config.get('COLD_WALLET')) {
    var opts = {
      destinationTag : payment.destination_tag,
      transaction_state : payment.result,
      hash : payment.hash
    };
    if (opts.destinationTag && (opts.transaction_state === 'tesSUCCESS')){
      if (opts.issuer === gateway.config.get('COLD_WALLET')) {
        if (payment.destination_balance_changes) {
          var balanceChange = payment.destination_balance_changes[0];
          if (balanceChange) {
            opts.amount = balanceChange.destination_amount.value;
            opts.currency = balanceChange.destination_amount.currency;
            opts.issuer = balanceChange.destination_amount.issuer;
            opts.state = 'incoming';
            gateway.api.recordIncomingPayment(opts, function(error, record) {
              if (error) {
                logger.error('payment:incoming:error', error);
              } else {
                try {
                  logger.info('payment:incoming:recorded', record.toJSON());
                } catch(exception) {
                  logger.error('payment:incoming:error', exception);
                }
              }
            });
          }
        }
      }
    }
  }
};

listener.start(gateway.config.get('LAST_PAYMENT_HASH'));

logger.info('Listening for incoming ripple payments from Ripple REST.');

