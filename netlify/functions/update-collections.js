// netlify/functions/update-collection.js
exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { data, message, sku } = JSON.parse(event.body);

    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format');
    }

    // GitHub configuration from environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER || 'artmusuem';
    const GITHUB_REPO = process.env.GITHUB_REPO || 'buddha';
    const FILE_PATH = 'data/buddha-collection.json'; // adjust this path as needed

    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token not configured');
    }

    const githubApiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // Step 1: Get current file to obtain SHA
    const getCurrentFile = await fetch(githubApiUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Buddha-Collection-Editor'
      }
    });

    if (!getCurrentFile.ok) {
      throw new Error(`Failed to get current file: ${getCurrentFile.status}`);
    }

    const currentFileData = await getCurrentFile.json();
    const sha = currentFileData.sha;

    // Step 2: Update the file
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    const updateResponse = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Buddha-Collection-Editor',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message || `Update Buddha collection via editor - ${new Date().toISOString()}`,
        content: content,
        sha: sha,
        committer: {
          name: 'Buddha Collection Editor',
          email: 'bromermuseum@gmail.com'
        }
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub API error: ${errorData.message || updateResponse.status}`);
    }

    const result = await updateResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'File updated successfully',
        commit: result.commit,
        sku: sku
      })
    };

  } catch (error) {
    console.error('Error updating GitHub:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};
