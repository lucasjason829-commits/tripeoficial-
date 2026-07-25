export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID do pagamento não informado' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.message || 'Erro ao consultar pagamento' });
    }

    return res.status(200).json({ status: data.status });

  } catch (err) {
    console.error('Erro:', err);
    return res.status(500).json({ error: 'Erro interno ao consultar status' });
  }
}
