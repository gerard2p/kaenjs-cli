import { watch } from 'chokidar';
import { cliPath, targetPath } from '@gerard2p/mce/paths';
import { rawSpawn } from '@gerard2p/mce/spawn';
import { livereload } from './livereload';

export function StartServer(args, opt) {
	let argv = ['--cache-directory', '--cache', '--respawn', '--all-deps', '--transpileOnly', '--prefer-ts', ...args];
	// console.log(args.join(' '));
	// console.log(argv.join(' '));
	let program = cliPath('node_modules/.bin/ts-node-dev');
	// program = `node -r ${cliPath('node_modules/ts-node/register')}`;
	// program = cliPath('node_modules/.bin/ts-node');
	// console.log(program);
	let server = rawSpawn(program, argv, {
		env: {
			PATH: process.env.PATH,
			HOME: targetPath(''),
			KAENCLI: 'true',
			DEBUG: opt.debug,
			NODE_ENV: opt.env,
			liveReloadHost: livereload.host
		},
		stdio: 'inherit'
	});
	let watcher = watch(['**/*.js', 'views/layouts/**/*.*'], {
		awaitWriteFinish: {
			stabilityThreshold: 700,
			pollInterval: 100
		},
		ignoreInitial: true,
		ignored: [
			'**/*.d.ts',
			'**/*.js.map',
			'.git',
			'node_modules',
			'src',
			'.vscode',
			'assets',
			'cached',
			'public',
			'locales',
			'*.tmp',
			'*.json',
			'*.conf'
		]
	}).on('all', (event, path) => {
		watcher.close();
		server.kill();
		server = StartServer(args, opt);
		console.log('==========');
		console.log('==========');
	});
	server.on('exit', (code: number, signal: string) => {
		let shouldExit = (code === 0 && signal === null) || (code === null && signal === 'SIGTERM');
		if (shouldExit) process.exit(code);
	});
	process.on('SIGINT', code => {
		process.exit(0);
	});
	return server;
}
