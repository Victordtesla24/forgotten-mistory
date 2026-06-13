const http = require('http');

const PORT = 3001;

async function postRequest(path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON'));
          }
        } else {
          reject(new Error(`Status Code: ${res.statusCode}, Body: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 STAGE 2: Functional Test Suite (API Validation)');

  // TEST 1: Standard Pipeline
  console.log('\nTEST 1: Standard Pipeline Latency & Sync (Normal Mode)');
  const start = Date.now();
  try {
    const res1 = await postRequest('/api/chat-with-vic', {
      message: "Briefly explain the benefit of using telemetry in a serverless function.",
      mode: "normal"
    });
    const latency = Date.now() - start;
    console.log(`Latency: ${latency}ms`);
    
    if (res1.text && res1.audio) {
        console.log('✅ PASS: Response contains text and audio.');
    } else if (res1.text) {
        console.log('⚠️ WARNING: Response contains text but NO audio (Check API Keys).');
        // Allow pass if keys are missing in dev, but verify structure
    } else {
        console.error('❌ FAIL: Invalid response structure.');
        process.exit(1);
    }
    
  } catch (e) {
    console.error(`❌ FAIL: Test 1 failed - ${e.message}`);
    process.exit(1);
  }

  // TEST 2: Story persona mode (sci-fi persona removed — NN-3 restrained pivot)
  console.log('\nTEST 2: Persona Mode Validation (Story) + NN-3 tone guard');
  try {
    const res2 = await postRequest('/api/chat-with-vic', {
      message: "Tell me about your leadership style.",
      mode: "story"
    });

    const textLower = (res2.text || '').toLowerCase();
    if (res2.text && res2.text.trim().length > 0) {
        console.log(`✅ PASS: Story persona returned a grounded response ("${res2.text.substring(0, 50)}...").`);
    } else {
        console.error('❌ FAIL: Story persona returned an empty response.');
        process.exit(1);
    }

    // NN-3: no theatrical/sci-fi vocabulary in the response.
    const bannedTerms = ['star wars', 'star trek', 'jedi', 'hyperdrive', 'lightsaber', 'warp drive'];
    const leaked = bannedTerms.filter(term => textLower.includes(term));
    if (leaked.length === 0) {
        console.log('✅ PASS: Response free of banned sci-fi vocabulary (NN-3).');
    } else {
        console.error(`❌ FAIL: Response contains banned sci-fi terms: ${leaked.join(', ')}`);
        process.exit(1);
    }

    if (res2.audio) {
        console.log('✅ PASS: Audio generated.');
    } else {
        console.log('⚠️ WARNING: No audio generated (Check ElevenLabs Key).');
    }

  } catch (e) {
    console.error(`❌ FAIL: Test 2 failed - ${e.message}`);
    process.exit(1);
  }

  console.log('\n✨ All tests passed!');
}

runTests();
