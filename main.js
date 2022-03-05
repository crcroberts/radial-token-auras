const Auras = {
	PERMISSIONS: ['all', 'limited', 'observer', 'owner', 'gm'],

	getAllAuras: function (doc) {
		return Auras.getManualAuras(doc).concat(doc.getFlag('radial-token-auras', 'auras') || []);
	},

	getManualAuras: function (doc) {
		let aura1 = doc.getFlag('radial-token-auras', 'aura1');
		let aura2 = doc.getFlag('radial-token-auras', 'aura2');
		return [aura1 || Auras.newAura(), aura2 || Auras.newAura()];
	},

	newAura: function () {
		return {
			distance: null,
			colour: '#ffffff',
			opacity: .5,
			permission: 'all',
			uuid: Auras.uuid(),
			angle: 360
		};
	},

	onConfigRender: function (config, html) {
		const auras = Auras.getManualAuras(config.token);

		// Expand the width
		config.position.width = 540;
		config.setPosition(config.position);

		const nav = html.find('nav.sheet-tabs.tabs');
		nav.append($(`
			<a class="item" data-tab="auras">
				<i class="far fa-dot-circle"></i>
				${game.i18n.localize('AURAS.Auras')}
			</a>
		`));

		const permissions = Auras.PERMISSIONS.map(perm => {
			let i18n = `PERMISSION.${perm.toUpperCase()}`;
			if (perm === 'all') {
				i18n = 'AURAS.All';
			}

			if (perm === 'gm') {
				i18n = 'USER.RoleGamemaster';
			}

			return {key: perm, label: game.i18n.localize(i18n)};
		});

		const auraConfig = auras.map((aura, idx) => `
			<div class="form-group">
				<label>${game.i18n.localize('AURAS.ShowTo')}</label>
				<select name="flags.radial-token-auras.aura${idx + 1}.permission">
					${permissions.map(option => `
						<option value="${option.key}"
						        ${aura.permission === option.key ? 'selected' : ''}>
							${option.label}
						</option>
					`)}
				</select>
			</div>
			<div class="form-group">
				<label>${game.i18n.localize('AURAS.AuraColour')}</label>
				<div class="form-fields">
					<input class="color" type="text" value="${aura.colour}"
					       name="flags.radial-token-auras.aura${idx + 1}.colour">
					<input type="color" value="${aura.colour}"
					       data-edit="flags.radial-token-auras.aura${idx + 1}.colour">
				</div>
			</div>
			<div class="form-group">
				<label>
					${game.i18n.localize('AURAS.Opacity')}
					<span class="units">(0 &mdash; 1)</span>
				</label>
				<input type="number" value="${aura.opacity}" step="any" min="0" max="1"
				       name="flags.radial-token-auras.aura${idx + 1}.opacity">
			</div>
			<div class="form-group">
				<label>
					${game.i18n.localize('SCENES.GridDistance')}
					<span class="units">(${game.i18n.localize('GridUnits')})</span>
				</label>
				<input type="number" value="${aura.distance ? aura.distance : ''}" step="any"
				       name="flags.radial-token-auras.aura${idx + 1}.distance" min="0">
			</div>
			<div class="form-group">
				<label>
					${game.i18n.localize('Emission Angle')}
					<span class="units">(${game.i18n.localize('Degrees')})</span>
				</label>
				<input type="number" value="${aura.angle ? aura.angle : '360'}" step="any"
				       name="flags.radial-token-auras.aura${idx + 1}.angle" min="0" max="360">
			</div>
		`);

		nav.parent().find('footer').before($(`
			<div class="tab" data-tab="auras">
				${auraConfig[0]}
				<hr>
				${auraConfig[1]}
			</div>
		`));

		nav.parent()
			.find('.tab[data-tab="auras"] input[type="color"][data-edit]')
            .change(config._onChangeInput.bind(config));
	},

	uuid: function () {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11)
			.replace(/[018]/g, c =>
				(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
	}
};

Hooks.on('renderTokenConfig', Auras.onConfigRender);

Token.prototype.draw = (function () {
	const cached = Token.prototype.draw;
	return function () {
		const p = cached.apply(this, arguments);
		this.auras = this.addChildAt(new PIXI.Container(), 0);
		this.drawAuras();
		return p;
	};
})();

Token.prototype.drawAuras = function () {
	this.auras.removeChildren().forEach(c => c.destroy());
	const auras = Auras.getAllAuras(this.document).filter(a => {
		if (!a.distance) {
			return false;
		}

		if (!a.permission || a.permission === 'all' || (a.permission === 'gm' && game.user.isGM)) {
			return true;
		}

		return !!this.document?.actor?.testUserPermission(game.user, a.permission.toUpperCase());
	});

	if (auras.length) {
		const gfx = this.auras.addChild(new PIXI.Graphics());
		const squareGrid = canvas.scene.data.gridType === 1;
		const dim = canvas.dimensions;
		const unit = dim.size / dim.distance;
		const [cx, cy] = [this.w / 2, this.h / 2];
		const {width, height} = this.data;
		const radians = (Math.PI / 180);

		auras.forEach(aura => {
			let w, h, a;

			[w, h] = [aura.distance, aura.distance];
			
			a = aura.angle;
			let angleBase = this.data.rotation + 450;
			let angleStart = (angleBase - (a / 2));
			let angleEnd = (angleBase + (a / 2));

			if (squareGrid) {
				w += width * dim.distance / 2;
				h += height * dim.distance / 2;
			} else {
				w += (width - 1) * dim.distance / 2;
				h += (height - 1) * dim.distance / 2;
			}

			w *= unit;
			h *= unit;
			angleStart *= radians;	
			angleEnd *= radians;

			gfx.beginFill(colorStringToHex(aura.colour), aura.opacity);
			gfx.moveTo(cx, cy);
			gfx.arc(cx, cy, w, angleStart, angleEnd, false);
			gfx.endFill();
		});
	}
};

Token.prototype._onUpdate = (function () {
	const cached = Token.prototype._onUpdate;
	return function (data) {
		cached.apply(this, arguments);
		const aurasUpdated =
			data.flags && data.flags['radial-token-auras']
			&& ['aura1', 'aura2', 'auras']
				.some(k => typeof data.flags['radial-token-auras'][k] === 'object');
		const rotationUpdated = data.hasOwnProperty("rotation");

		if (aurasUpdated || rotationUpdated) {
			this.drawAuras();
		}
	};
})();
