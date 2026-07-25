// api/criar-pix.js
// Roda no servidor (Vercel Function) — o token do Mercado Pago fica
// guardado em variável de ambiente, nunca aparece no código do site.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { nome, email, cpf, valor, descricao } = req.body || {};

  if (!nome || !email || !cpf || !valor) {
    return res.status(400).json({ error: 'Dados incompletos (nome, email, cpf, valor)' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: 'Access Token do Mercado Pago não configurado' });
  }

  try {
    const partesNome = String(nome).trim().split(' ');
    const primeiroNome = partesNome[0] || 'Cliente';
    const sobrenome = partesNome.slice(1).join(' ') || 'Cliente';

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        // evita cobrança duplicada em caso de reenvio da requisição
        'X-Idempotency-Key': `${cpf}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: descricao || 'Compra no checkout',
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: primeiroNome,
          last_name: sobrenome,
          identification: {
            type: 'CPF',
            number: String(cpf).replace(/\D/g, '')
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro Mercado Pago:', data);
      return res.status(response.status).json({
        error: data.message || 'Erro ao gerar o Pix no Mercado Pago'
      });
    }

    const txData = data.point_of_interaction?.transaction_data;

    if (!txData || !txData.qr_code) {
      return res.status(500).json({ error: 'Mercado Pago não retornou o QR Code' });
    }

    return res.status(200).json({
      payment_id: data.id,
      status: data.status,
      qr_code: txData.qr_code,
      qr_code_base64: txData.qr_code_base64
    });

  } catch (error) {
    console.error('Erro ao gerar Pix:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar o Pix' });
  }
}
