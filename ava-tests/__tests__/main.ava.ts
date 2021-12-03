import { Workspace, captureError } from 'near-workspaces-ava';

const workspace = Workspace.init(async ({ root }) => {
  const alice = await root.createAccount('alice');
  const faucet = await root.createAndDeploy(
    'faucet',
    '../contract-rs/res/faucet.wasm',
  );
  return { alice, faucet };
});

workspace.test('New', async (test, { faucet, root }) => {
  const accountSuffix = '.' + faucet.accountId;
  const minDifficulty = 5;
  await root.call(
    faucet,
    'new',
    { account_suffix: accountSuffix, min_difficulty: minDifficulty }
  );

  test.is(
    await faucet.view('get_account_suffix'),
    accountSuffix,
  );
  test.is(
    await faucet.view('get_min_difficulty'),
    minDifficulty,
  );
  test.is(
    await faucet.view('get_num_created_accounts'),
    0,
  );
});

workspace.test('Create account ok', async (test, { faucet, root }) => {
  const accountSuffix = '.' + faucet.accountId;
  const minDifficulty = 0;
  await root.call(
    faucet,
    'new',
    { account_suffix: accountSuffix, min_difficulty: minDifficulty }
  );

  const accountId = 'test' + accountSuffix;
  const publicKey = new Array(33).fill(0);
  const salt = 0;

  await root.call(
    faucet,
    'create_account',
    {
      account_id: accountId,
      public_key: publicKey,
      salt: salt,
    }
  );
  test.is(
    await faucet.view('get_num_created_accounts'),
    1,
  );
});


workspace.test('Fail create account bad name', async (test, { faucet, root }) => {
  const accountSuffix = '.' + faucet.accountId;
  const minDifficulty = 0;
  await root.call(
    faucet,
    'new',
    { account_suffix: accountSuffix, min_difficulty: minDifficulty }
  );

  const accountId = 'bob';
  const publicKey = new Array(33).fill(0);
  const salt = 0;

  const errorString = await captureError(async () =>
    root.call(
      faucet,
      'create_account',
      {
        account_id: accountId,
        public_key: publicKey,
        salt: salt,
      }
    )
  );

  test.regex(errorString, /Account has to end with the suffix/);
});


workspace.test('Fail create account already created', async (test, { faucet, root }) => {
  const accountSuffix = '.' + faucet.accountId;
  const minDifficulty = 0;
  await root.call(
    faucet,
    'new',
    { account_suffix: accountSuffix, min_difficulty: minDifficulty }
  );

  const accountId = 'test' + accountSuffix;
  const publicKey = new Array(33).fill(0);
  const salt = 0;

  await root.call(
    faucet,
    'create_account',
    {
      account_id: accountId,
      public_key: publicKey,
      salt: salt,
    }
  );
  test.is(
    await faucet.view('get_num_created_accounts'),
    1,
  );
  const errorString = await captureError(async () =>
    root.call(
      faucet,
      'create_account',
      {
        account_id: accountId,
        public_key: publicKey,
        salt: salt,
      }
    )
  );
  test.regex(errorString, /The given given account is already created/);
});

workspace.test('Fail work is too weak', async (test, { faucet, root }) => {
  const accountSuffix = '.' + faucet.accountId;
  const minDifficulty = 20;
  await root.call(
    faucet,
    'new',
    { account_suffix: accountSuffix, min_difficulty: minDifficulty }
  );

  const accountId = 'test' + accountSuffix;
  const publicKey = new Array(33).fill(0);
  const salt = 0;

  const errorString = await captureError(async () =>
    root.call(
      faucet,
      'create_account',
      {
        account_id: accountId,
        public_key: publicKey,
        salt: salt,
      }
    )
  );
  test.regex(errorString, /The proof is work is too weak/);
});

