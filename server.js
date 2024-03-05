const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const API_KEY = 'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';

app.get('/:formId/filteredResponses', async (req, res) => {
  const { formId } = req.params;
  const { filters, ...otherParams } = req.query;

  try {
    const filterParams = filters ? JSON.parse(filters) : [];

    // Fetch form responses from Fillout.com
    const response = await axios.get(`https://api.fillout.com/v1/api/forms/${formId}/submissions`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      params: otherParams
    });

    // Filter responses based on the filters parameter
    let filteredResponses = response.data.responses;
    if (filterParams.length > 0) {
      filteredResponses = filteredResponses.filter(submission => {
        return filterParams.every(filter => {
          const { id, condition, value } = filter;
          const question = submission.questions.find(q => q.id === id);
          if (!question) return false; // Skip if question ID not found
          const responseValue = question.value;
          switch (condition) {
            case 'equals':
              return responseValue === value;
            case 'does_not_equal':
              return responseValue !== value;
            case 'greater_than':
              return responseValue > value;
            case 'less_than':
              return responseValue < value;
            default:
              return false; // Invalid condition
          }
        });
      });
    }

    // After filtering the responses based on the provided filters
    let totalResponses = filteredResponses.length;
    let pageCount = 1;

    // Prepare the final response object
    const finalResponse = {
      responses: filteredResponses,
      totalResponses: totalResponses,
      pageCount: pageCount
    };

    res.json(finalResponse);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    res.status(500).send('Error fetching form responses');
  }
});

// Catch-all route
app.get('*', (req, res) => {
  res.status(404).send('Endpoint not found. Please use /{formId}/filteredResponses to fetch and filter form responses.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});