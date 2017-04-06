import app from '../../../app';
import '../../../lib/select2';
import { getCurrenciesSortedByCode } from '../../../data/currencies';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import Spend, { spend } from '../../../models/wallet/Spend';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this._saveInProgress = false;
    this.sendConfirmOn = false;
    this.model = new Spend();
  }

  className() {
    return 'sendMoney';
  }

  events() {
    return {
      'click .js-btnSend': 'onClickSend',
      'click .js-sendMoneyClear': 'onClickClear',
      'click .js-btnConfirmSend': 'onClickConfirmSend',
      'click .js-sendConfirmCancel': 'onClickSendConfirmCancel',
    };
  }

  onClickConfirmSend() {
    this.$sendConfirm.addClass('hide');

    // POSTing payment to the server
    // this.$btnSend.addClass('processing');
    this.saveInProgress = true;

    spend(this.model.toJSON())
      .done(() => {
        // temporary alert until the transactions list is implemented
        openSimpleMessage('You payment has been sent.');
      })
      .fail(jqXhr => {
        openSimpleMessage(app.polyglot.t('wallet.sendMoney.sendPaymentFailDialogTitle'),
          jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
      })
      .always(() => {
        // this.$btnSend.removeClass('processing');
        this.clearModel();
        this.saveInProgress = false;
      });
  }

  onClickSend() {
    const formData = this.getFormData(this.$formFields);
    this.model.set(formData);
    this.model.set({}, { validate: true });

    // render so errors are shown / cleared
    this.render();

    if (!this.model.validationError) {
      this.$sendConfirm.removeClass('hide');
    }

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  onClickSendConfirmCancel() {
    this.$sendConfirm.addClass('hide');
  }

  onClickClear() {
    this.clearForm();
  }

  focusAddress() {
    if (!this.saveInProgress) this.$addressInput.focus();
  }

  setFormData(data = {}, focusAddressInput = true) {
    this.clearForm();
    this.model.set(data);
    this.render();
    if (focusAddressInput) this.focusAddressInput();
  }

  clearModel() {
    // this.model.clear();

    // for some reason model.clear is not working, so we'll go
    // with a manual approach
    this.model.unset('address');
    this.model.unset('amount');
    this.model.unset('memo');
    this.model.unset('currency');
    this.model.set(this.model.defaults || {});
    this.model.validationError = null;
  }

  clearForm() {
    this.clearModel();
    this.render();
  }

  set saveInProgress(bool) {
    if (typeof bool !== 'boolean') {
      throw new Error('Please provide a boolean.');
    }

    if (bool !== this.saveInProgress) {
      this._saveInProgress = bool;
      this.render();
    }
  }

  get saveInProgress() {
    return this._saveInProgress;
  }

  get $addressInput() {
    return this._$addressInput ||
      (this._$addressInput = this.$('#walletSendTo'));
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields = this.$(`select[name], input[name], 
        textarea[name]:not([class*="trumbowyg"]), 
        div[contenteditable][name]`));
  }

  get $btnSend() {
    return this._$btnSend ||
      (this._$btnSend = this.$('.js-btnSend'));
  }

  get $sendConfirm() {
    return this._$sendConfirm ||
      (this._$sendConfirm = this.$('.js-sendConfirm'));
  }

  render() {
    loadTemplate('modals/wallet/sendMoney.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        currency: this.model.get('currency') || app.settings.get('localCurrency'),
        currencies: this.currencies ||
          getCurrenciesSortedByCode(),
        sendConfirmOn: this.sendConfirmOn,
        saveInProgress: this.saveInProgress,
      }));

      this._$addressInput = null;
      this._$formFields = null;
      this._$btnSend = null;
      this._$sendConfirm = null;

      this.$('#walletSendCurrency').select2();
    });

    return this;
  }
}
