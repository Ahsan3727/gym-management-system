import{r as l,k as E,j as e,d as v}from"./index-C_tPJ594.js";import{M as F}from"./Modal-1d8FmD9u.js";import{e as d}from"./escapeHtml-BrT_wUhv.js";function H(){const[g,C]=l.useState([]),[a,D]=l.useState(null),[z,T]=l.useState(!0),[y,$]=l.useState(""),[c,m]=l.useState(null),[o,x]=l.useState({paymentMethod:"bank_transfer",reference:"",bankName:"",note:""}),[k,w]=l.useState(!1),[S,N]=l.useState(""),{showToast:j}=E();async function P(){try{const[t,n]=await Promise.all([v.get("/admin/platform-fees"),v.get("/admin/platform-fees/summary")]);C(t.data),D(n.data)}catch{$("Could not load platform dues.")}finally{T(!1)}}l.useEffect(()=>{P()},[]);function h(t,n){t&&navigator.clipboard.writeText(t).then(()=>{j(`${n} copied to clipboard!`,{type:"success"})}).catch(()=>{j(`Could not copy ${n}`,{type:"error"})})}function A(t){var n,r,i;m(t),x({paymentMethod:t.paymentMethod||"bank_transfer",reference:((n=t.paymentProof)==null?void 0:n.reference)||"",bankName:((r=t.paymentProof)==null?void 0:r.bankName)||"",note:((i=t.paymentProof)==null?void 0:i.note)||""}),N("")}async function R(t){var n,r;t.preventDefault(),w(!0),N("");try{await v.post(`/admin/platform-fees/${c._id}/submit-proof`,o),m(null),j("Payment proof submitted successfully! Super admin will verify shortly.",{type:"success"}),await P()}catch(i){N(((r=(n=i.response)==null?void 0:n.data)==null?void 0:r.message)||"Could not submit payment proof.")}finally{w(!1)}}function I(t){const n=window.open("","_blank"),r=d(t.invoiceNumber),i=d(t.status),p=d(t.billingCycle||"N/A"),O=d(t.paymentMethod||""),B=d(t.transactionReference||""),M=d(t.title||"Platform Fee"),L=d(t.feeType||"Subscription");n.document.write(`
      <html>
        <head>
          <title>Invoice - ${r}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 750px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; }
            .brand { font-size: 24px; font-weight: 800; color: #111; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .paid { background: #dcfce7; color: #15803d; }
            .unpaid { background: #fef9c3; color: #854d0e; }
            .overdue { background: #fee2e2; color: #b91c1c; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
            .box h4 { margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; }
            .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
            .table th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 13px; border-bottom: 1px solid #cbd5e1; }
            .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .total { text-align: right; font-size: 18px; font-weight: 800; margin-top: 16px; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">IRONLINE PLATFORM</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Software License & Platform Subscription</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 20px;">${r}</h2>
              <div style="margin-top: 6px;"><span class="badge ${i}">${i}</span></div>
            </div>
          </div>

          <div class="details-grid">
            <div class="box">
              <h4>Invoice Meta</h4>
              Billing Period: <strong>${p}</strong><br/>
              Issue Date: <strong>${new Date(t.created_at).toLocaleDateString()}</strong><br/>
              Due Date: <strong>${new Date(t.dueDate).toLocaleDateString()}</strong><br/>
              ${t.paidOn?`Paid On: <strong>${new Date(t.paidOn).toLocaleDateString()}</strong><br/>Method: <strong>${O}</strong>`:""}
              ${t.transactionReference?`<br/>Ref #: <strong>${B}</strong>`:""}
            </div>
            <div class="box">
              <h4>Payment Status</h4>
              Current Status: <strong>${i.toUpperCase()}</strong><br/>
              Total Billed: <strong>Rs. ${Number(t.amount||0).toLocaleString()}</strong>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Period</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${M}</strong></td>
                <td style="text-transform: capitalize;">${L}</td>
                <td>${p||"—"}</td>
                <td style="text-align: right; font-weight: 700;">Rs. ${Number(t.amount||0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Amount: Rs. ${Number(t.amount||0).toLocaleString()}
          </div>

          <div class="footer">
            Official receipt issued by Ironline Platform Administration.
          </div>
          <script>window.print();<\/script>
        </body>
      </html>
    `),n.document.close()}if(z&&!a)return e.jsx("div",{className:"text-sm text-steel",children:"Loading platform dues…"});const s=(a==null?void 0:a.bankDetails)||{},u=a==null?void 0:a.isSeverelyOverdue,b=(a==null?void 0:a.overdueCount)>0,f=(a==null?void 0:a.totalOutstanding)>0;return e.jsxs("div",{className:"page-enter space-y-8",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-headline text-ink",children:"Platform Subscription & Dues"}),e.jsx("p",{className:"text-caption mt-0.5",children:"View your Ironline SaaS software subscription invoices, payment instructions, and submit transaction receipts."})]}),y&&e.jsx("div",{className:"text-sm text-danger",children:y}),e.jsx("div",{className:`panel p-6 border-l-4 ${u||b?"border-l-danger bg-danger/5":f?"border-l-iron bg-iron/5":"border-l-chalk-dark bg-chalk/5"}`,children:e.jsxs("div",{className:"flex flex-col md:flex-row md:items-center md:justify-between gap-4",children:[e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2",children:e.jsx("span",{className:u||b?"badge-danger":f?"badge-warning":"badge-active",children:u?"Service Restriction Warning":b?"Payment Overdue":f?"Payment Pending":"Account in Good Standing"})}),e.jsx("h3",{className:"mt-2 text-lg font-bold text-ink",children:u?"Your platform fee is past the grace period. Please clear outstanding dues.":b?"You have overdue platform subscription dues.":f?"You have an active platform invoice pending payment.":"All platform subscription dues are cleared. Thank you!"}),e.jsxs("p",{className:"mt-1 text-xs text-steel",children:["Overdue grace period: ",(a==null?void 0:a.gracePeriodDays)||14," days. After transfer, submit your transaction ID below."]})]}),e.jsxs("div",{className:"flex flex-col items-start md:items-end",children:[e.jsx("span",{className:"text-xs text-steel",children:"Outstanding Balance"}),e.jsxs("span",{className:"text-2xl font-mono font-extrabold text-ink",children:["Rs. ",((a==null?void 0:a.totalOutstanding)||0).toLocaleString()]})]})]})}),e.jsxs("div",{className:"panel p-6 space-y-4",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-semibold text-ink flex items-center gap-2",children:[e.jsx("svg",{className:"icon !h-5 !w-5 text-iron",children:e.jsx("use",{href:"#i-card"})}),"Official Payment Instructions & Transfer Details"]}),e.jsx("p",{className:"text-xs text-steel mt-0.5",children:"Transfer your subscription dues directly to the official platform bank account or mobile wallet below:"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 pt-2",children:[s.bankName&&e.jsxs("div",{className:"rounded-xl border border-ink/10 bg-ink/[0.02] p-4 space-y-1",children:[e.jsx("span",{className:"text-[11px] font-semibold text-steel uppercase",children:"Bank Transfer"}),e.jsx("div",{className:"font-bold text-ink",children:s.bankName}),e.jsxs("div",{className:"text-xs text-steel",children:["Title: ",e.jsx("strong",{className:"text-ink",children:s.accountTitle})]}),s.accountNumber&&e.jsxs("div",{className:"flex items-center justify-between mt-2 pt-2 border-t border-ink/10",children:[e.jsx("span",{className:"text-xs font-mono font-semibold text-ink",children:s.accountNumber}),e.jsx("button",{onClick:()=>h(s.accountNumber,"Account Number"),className:"text-[11px] font-semibold text-iron hover:underline",children:"Copy"})]})]}),s.iban&&e.jsxs("div",{className:"rounded-xl border border-ink/10 bg-ink/[0.02] p-4 space-y-1",children:[e.jsx("span",{className:"text-[11px] font-semibold text-steel uppercase",children:"IBAN Transfer"}),e.jsx("div",{className:"font-bold text-ink truncate",title:s.iban,children:s.iban}),e.jsxs("div",{className:"text-xs text-steel",children:["Title: ",e.jsx("strong",{className:"text-ink",children:s.accountTitle})]}),e.jsx("div",{className:"flex items-center justify-end mt-2 pt-2 border-t border-ink/10",children:e.jsx("button",{onClick:()=>h(s.iban,"IBAN"),className:"text-[11px] font-semibold text-iron hover:underline",children:"Copy IBAN"})})]}),(s.jazzcashNumber||s.easypaisaNumber)&&e.jsxs("div",{className:"rounded-xl border border-ink/10 bg-ink/[0.02] p-4 space-y-2",children:[e.jsx("span",{className:"text-[11px] font-semibold text-steel uppercase",children:"Mobile Wallets"}),s.jazzcashNumber&&e.jsxs("div",{className:"flex items-center justify-between text-xs",children:[e.jsxs("span",{children:["JazzCash: ",e.jsx("strong",{className:"font-mono text-ink",children:s.jazzcashNumber})]}),e.jsx("button",{onClick:()=>h(s.jazzcashNumber,"JazzCash"),className:"text-[11px] font-semibold text-iron hover:underline",children:"Copy"})]}),s.easypaisaNumber&&e.jsxs("div",{className:"flex items-center justify-between text-xs pt-1 border-t border-ink/5",children:[e.jsxs("span",{children:["EasyPaisa: ",e.jsx("strong",{className:"font-mono text-ink",children:s.easypaisaNumber})]}),e.jsx("button",{onClick:()=>h(s.easypaisaNumber,"EasyPaisa"),className:"text-[11px] font-semibold text-iron hover:underline",children:"Copy"})]})]})]}),s.note&&e.jsxs("div",{className:"rounded-lg bg-ink/5 px-4 py-2.5 text-xs text-steel",children:[e.jsx("strong",{children:"Note:"})," ",s.note]})]}),e.jsxs("div",{className:"panel overflow-hidden",children:[e.jsxs("div",{className:"border-b border-ink/10 px-6 py-4 flex items-center justify-between",children:[e.jsx("h3",{className:"font-semibold text-ink",children:"Invoices & Subscription History"}),e.jsxs("span",{className:"text-xs text-steel",children:[g.length," records"]})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-sm",children:[e.jsx("thead",{className:"border-b border-ink/10 bg-ink/[0.02] text-xs font-semibold text-steel uppercase tracking-wider",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3.5",children:"Invoice #"}),e.jsx("th",{className:"px-6 py-3.5",children:"Description"}),e.jsx("th",{className:"px-6 py-3.5",children:"Period"}),e.jsx("th",{className:"px-6 py-3.5",children:"Amount"}),e.jsx("th",{className:"px-6 py-3.5",children:"Due Date"}),e.jsx("th",{className:"px-6 py-3.5",children:"Status"}),e.jsx("th",{className:"px-6 py-3.5 text-right",children:"Actions"})]})}),e.jsx("tbody",{className:"divide-y divide-ink/10",children:g.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:7,className:"px-6 py-10 text-center text-steel",children:"No platform subscription invoices issued yet."})}):g.map(t=>{var p;const n=t.status==="paid",r=t.status==="overdue",i=!!((p=t.paymentProof)!=null&&p.reference);return e.jsxs("tr",{className:"hover:bg-ink/[0.015] transition-colors",children:[e.jsx("td",{className:"px-6 py-4 font-mono font-bold text-xs text-ink",children:t.invoiceNumber}),e.jsxs("td",{className:"px-6 py-4",children:[e.jsx("div",{className:"font-semibold text-ink",children:t.title}),e.jsx("div",{className:"text-xs text-steel capitalize",children:t.feeType}),i&&!n&&e.jsxs("div",{className:"mt-1 text-[11px] font-semibold text-amber-600",children:["Proof Submitted: Ref #",t.paymentProof.reference," (Awaiting SuperAdmin Verification)"]})]}),e.jsx("td",{className:"px-6 py-4 text-xs text-steel whitespace-nowrap",children:t.billingCycle||"—"}),e.jsxs("td",{className:"px-6 py-4 font-mono font-bold text-ink whitespace-nowrap",children:["Rs. ",t.amount.toLocaleString()]}),e.jsx("td",{className:"px-6 py-4 text-xs whitespace-nowrap text-steel",children:new Date(t.dueDate).toLocaleDateString()}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:n?"badge-active":r?"badge-danger":t.status==="waived"?"badge-inactive":"badge-warning",children:t.status})}),e.jsx("td",{className:"px-6 py-4 text-right whitespace-nowrap",children:e.jsxs("div",{className:"flex items-center justify-end gap-2 text-xs font-semibold",children:[!n&&t.status!=="waived"&&e.jsx("button",{onClick:()=>A(t),className:"btn-primary btn-sm",children:i?"Update Proof":"Submit Proof"}),e.jsx("button",{onClick:()=>I(t),className:"btn-secondary btn-sm",children:"Print Receipt"})]})})]},t._id)})})]})})]}),c&&e.jsx(F,{title:`Submit Payment Proof — ${c.invoiceNumber}`,onClose:()=>m(null),width:"max-w-md",children:e.jsxs("form",{onSubmit:R,className:"space-y-4",children:[e.jsxs("div",{className:"rounded-lg bg-ink/[0.03] p-3 text-sm border border-ink/10",children:[e.jsx("div",{className:"font-semibold text-ink",children:c.title}),e.jsxs("div",{className:"mt-1 font-mono font-bold text-ink",children:["Amount Due: Rs. ",c.amount.toLocaleString()]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"field-label",children:"Payment Method Used"}),e.jsxs("select",{className:"field-input",value:o.paymentMethod,onChange:t=>x({...o,paymentMethod:t.target.value}),required:!0,children:[e.jsx("option",{value:"bank_transfer",children:"Bank Transfer (IBAN / Online)"}),e.jsx("option",{value:"jazzcash",children:"JazzCash"}),e.jsx("option",{value:"easypaisa",children:"EasyPaisa"}),e.jsx("option",{value:"cash",children:"Cash in Hand"}),e.jsx("option",{value:"cheque",children:"Cheque"}),e.jsx("option",{value:"other",children:"Other"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"field-label",children:"Transaction ID / Reference #"}),e.jsx("input",{className:"field-input font-mono",value:o.reference,onChange:t=>x({...o,reference:t.target.value}),placeholder:"e.g. UTR / Transaction Ref ID",required:!0}),e.jsx("p",{className:"mt-1 text-xs text-steel",children:"Enter the reference or transaction ID shown in your banking app."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"field-label",children:"Your Bank / App Name"}),e.jsx("input",{className:"field-input",value:o.bankName,onChange:t=>x({...o,bankName:t.target.value}),placeholder:"e.g. Meezan Bank, HBL, Allied Bank"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"field-label",children:"Additional Note (Optional)"}),e.jsx("textarea",{className:"field-input",rows:2,value:o.note,onChange:t=>x({...o,note:t.target.value}),placeholder:"e.g. Transferred from Account #0123 on Sep 15."})]}),S&&e.jsx("div",{className:"text-sm text-danger",children:S}),e.jsxs("div",{className:"flex justify-end gap-3 pt-2",children:[e.jsx("button",{type:"button",onClick:()=>m(null),className:"btn-secondary",children:"Cancel"}),e.jsx("button",{type:"submit",disabled:k,className:"btn-primary",children:k?"Submitting...":"Submit Payment Proof"})]})]})})]})}export{H as default};
