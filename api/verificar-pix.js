// api/verificar-pix.js
// Consulta o status de um pagamento Pix já criado, pra saber se o cliente já pagou.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID do pagamento não informado' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'Access Token do Mercado Pago não configurado' });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Erro ao verificar pagamento' });
    }

    return res.status(200).json({
      status: data.status // pending | approved | rejected | cancelled ...
    });

  } catch (error) {
    console.error('Erro ao verificar Pix:', error);
    return res.status(500).json({ error: 'Erro interno ao verificar o pagamento' });
  }
}
