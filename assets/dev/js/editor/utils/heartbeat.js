export default class Heartbeat {
	modal = null;

	constructor() {
		this.onSend = this.onSend.bind( this );
		this.onTick = this.onTick.bind( this );
		this.onRefreshNonce = this.onRefreshNonce.bind( this );

		this.bindEvents();

		if ( elementor.config.document.user.locked ) {
			this.showLockMessage( elementor.config.document.user.locked );
		}
	}

	getModal = () => {
		if ( ! this.modal ) {
			this.modal = this.initModal();
		}

		return this.modal;
	};

	initModal() {
		const modal = elementorCommon.dialogsManager.createWidget( 'lightbox', {
			headerMessage: elementor.translate( 'take_over' ),
		} );

		modal.addButton( {
			name: 'go_back',
			text: elementor.translate( 'go_back' ),
			callback() {
				parent.history.go( -1 );
			},
		} );

		modal.addButton( {
			name: 'take_over',
			text: elementor.translate( 'take_over' ),
			callback() {
				wp.heartbeat.enqueue( 'elementor_force_post_lock', true );
				wp.heartbeat.connectNow();
			},
		} );

		return modal;
	}

	showLockMessage( lockedUser ) {
		const modal = this.getModal();

		modal
			.setMessage( elementor.translate( 'dialog_user_taken_over', [ lockedUser ] ) )
			.show();
	}

	onSend( event, data ) {
		data.elementor_post_lock = {
			post_ID: elementor.config.document.id,
		};
	}

	onTick( event, response ) {
		if ( response.locked_user ) {
			if ( elementor.saver.isEditorChanged() ) {
				// TODO: Change to 'document/save/auto' ?.
				$e.internal( 'document/save/save', { status: 'autosave' } );
			}

			this.showLockMessage( response.locked_user );
		} else {
			this.getModal().hide();
		}

		elementorCommon.ajax.addRequestConstant( '_nonce', response.elementorNonce );
	}

	onRefreshNonce( event, response ) {
		const nonces = response[ 'elementor-refresh-nonces' ];

		if ( nonces ) {
			if ( nonces.heartbeatNonce ) {
				elementorCommon.ajax.addRequestConstant( '_nonce', nonces.elementorNonce );
			}

			if ( nonces.heartbeatNonce ) {
				window.heartbeatSettings.nonce = nonces.heartbeatNonce;
			}
		}
	}

	bindEvents() {
		jQuery( document ).on( {
			'heartbeat-send': this.onSend,
			'heartbeat-tick': this.onTick,
			'heartbeat-tick.wp-refresh-nonces': this.onRefreshNonce,
		} );
	}

	destroy() {
		jQuery( document ).off( {
			'heartbeat-send': this.onSend,
			'heartbeat-tick': this.onTick,
			'heartbeat-tick.wp-refresh-nonces': this.onRefreshNonce,
		} );
	}
}
