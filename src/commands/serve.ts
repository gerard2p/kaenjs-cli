import { bool, enumeration, numeric, Parsed, text } from '@bitsun/mce';
import { StartServer } from '../utilities/daemon';
import axios from 'axios';
import { configuration } from '../utilities/configurations';
import { ok } from '@bitsun/mce/console';
import { targetPath } from '@bitsun/mce/paths';
import { existsSync, readdirSync, statSync } from 'fs';
export let description = 'Start the server in watch mode.\n      To lauch in production use "node server\n      [proram=server]"';
export let args = '[program]';
export let options = {
    inspectBrk: numeric('<port>', 'port for inspector'),
    env: enumeration('<env>', 'Run in which configuration', ['development', 'production'], 'development'),
    nginx: bool('-n', 'Generates and Instal nginx configuration'),
    assets: bool('-a', 'Watch for changes in assets and templates'),
    debug: text('<opt>', 'argument to pass to DEBUG env var', 'kaen')
};
const redbird = axios.create({baseURL: 'http://localhost:6060'});
function loadRoutes() {
	if (existsSync(targetPath('src/routes')) && statSync(targetPath('src/routes')).isDirectory()) {
		for (const file of readdirSync(targetPath('src/routes'))) {
			if (/\.map$/.exec(file) === null) {
				let subdomain = file.replace(/\..*$/g, '');
				process.env.KAEN_INTERNAL_SUBDOMAIN = subdomain;
				require(targetPath('src/routes', file));
			}
		}
	} else {
		require(targetPath('./routes'));
	}
}
async function registerHosts() {
	loadRoutes();
	console.log(0);
	const {Router} = require(targetPath('node_modules/@kaenjs/router'));
	const {host} = configuration.server;
	let targets = Router.subdomains.map(s=>`${s}.${host}`);
	let hosts = (await redbird.get('hosts/')).data;
	targets.push(host);
	for(const target of targets) {
		if(!hosts[target]) {
			let res = await redbird.post('hosts/',{
				source: '127.0.0.1',
				target
			});
			if(res.status === 201) {
				ok(`domain ${target} registered on @gerard2p/redbird`);
			}
		}
	}
}
async function registerProxy({key, cert}) {
	loadRoutes();
	console.log(1);
	require(targetPath('node_modules/@kaenjs/router'));
	console.log(2);
	require(targetPath('node_modules/@kaenjs/router'));
	console.log(3);
	const {Router} = require(targetPath('node_modules/@kaenjs/router'));
	let proxies = await (await redbird.get('proxy/')).data;
	let source = `127.0.0.1:${configuration.server.port}`;
	const {host} = configuration.server;
	let targets = Router.subdomains.map(s=>`${s}.${host}`);
	let options = undefined;
	if(key && cert) {
		source = `https://${source}`;
		options = {ssl:{key, cert}};
	} else {
		source = `http://${source}`;
	}
	let body:any = {
		source,
		target: targets
	};
	if(options)body.options = options;
	if(!proxies[source]) {
		let {status} = await (redbird.post('proxy/', body));
		if(status === 201)
			ok('Reverse Proxy Created on @gerard2p/redbird');
	}
}
export async function action(program: string, opt: Parsed<typeof options>) {
    let args = [];
	if (opt.inspectBrk) args.push(`--inspect-brk=${opt.inspectBrk}`);
	let file = program || 'server.ts';
	args.push(`src/${file}`);
	// await registerHosts();
	// await registerProxy(configuration.server.https || {});
    StartServer(args, opt);
    // if (opt.env === 'development') {
    //     updateHostsFile();
    // }
    // if (opt.nginx) {
    //     await nginx({ install: true, certbot: '' });
    // }
    // if ( opt.assets ) {
    //     let watchers: { compiler: Compiler, bundle: string }[] = await resources({ env: opt.env, cache: true });
    //     for (const { compiler } of watchers) {
    //         compiler.watch({
    //             aggregateTimeout: 300,
    //             poll: undefined
    //         }, (err, stats) => {
    //             if (stats.hasErrors()) {
    //                 console.log(stats.toString());
    //             } else {
    //                 if (existsSync(targetPath('public/css/.___ignore_me___'))) unlinkSync(targetPath('public/css/.___ignore_me___'));
    //                 if (existsSync(targetPath('public/img/.___ignore_me___'))) unlinkSync(targetPath('public/img/.___ignore_me___'));
    //                 let { assets } = stats.toJson();
    //                 assets = assets.filter(a => a.emitted) as any[];
    //                 for (const { name } of assets) {
    //                     if (name === '.___ignore_me___') continue;
    //                     let ext = extname(name);
    //                     if (['.js', '.css'].includes(ext)) {
    //                         livereload.build(name);
    //                     } else {
    //                         livereload.refresh(name);
    //                     }
    //                 }
    //             }
    //         });
    //     }
    //     let compiled_resources = [];
    //     for (const [bundle] of iter(configuration.bundles)) {
    //         compiled_resources.push(targetPath('public', extname(bundle).replace('.', ''), bundle));
    //     }
    //     watch(compiled_resources, {
    //         awaitWriteFinish: {
    //             stabilityThreshold: 700,
    //             pollInterval: 100
    //         },
    //         ignoreInitial: true,
    //     }).on('all', (event, file) => {
    //         let bfile = basename(file);
    //         livereload.refresh(bfile);
    //     });
    // }
}
