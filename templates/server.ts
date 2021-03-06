import { KaenServer } from '@kaenjs/core';
import { Localization } from '@kaenjs/localization';
import { Views } from '@kaenjs/views';
import { BodyParser } from '@kaenjs/body-parser';
import { Passport } from '@kaenjs/passport';
import { Session } from '@kaenjs/session';
import { StaticContent } from '@kaenjs/static';
import { Routes, Router, Subdomains } from '@kaenjs/router';
import { Databases, Seed } from '@kaenjs/vault-orm';
new KaenServer()
	.add(Subdomains('www'))
	.add(StaticContent())
	.add(BodyParser({
		files: ['image/png', 'image/jpg', 'image/jpeg']
	}))
	.add(Localization)
	.add(Session())
	.add(Passport(Router))
	.add(Views)
	.add(Routes())
	.ready(async () => {
		await Databases;
		await Seed();
	})
	.listen();
