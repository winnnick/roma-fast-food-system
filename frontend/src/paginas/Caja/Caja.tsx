import {
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle
} from "lucide-react";


function Caja(){


    const movimientos = [
        {
            id:1,
            tipo:"Ingreso",
            concepto:"Venta #001",
            usuario:"Administrador",
            monto:50
        },
        {
            id:2,
            tipo:"Egreso",
            concepto:"Pago empleado",
            usuario:"Administrador",
            monto:100
        }
    ];



    return(

        <div>


            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">

                <Wallet/>
                Caja

            </h1>



            <div className="grid md:grid-cols-3 gap-5 mb-6">


                <div className="bg-white shadow rounded-xl p-5">

                    <p className="text-gray-500">
                        Estado
                    </p>

                    <h2 className="text-2xl font-bold text-green-600">
                        Caja abierta
                    </h2>

                </div>


                <div className="bg-white shadow rounded-xl p-5">

                    <p className="text-gray-500">
                        Monto inicial
                    </p>

                    <h2 className="text-2xl font-bold">
                        Bs. 200
                    </h2>

                </div>


                <div className="bg-white shadow rounded-xl p-5">

                    <p className="text-gray-500">
                        Efectivo actual
                    </p>

                    <h2 className="text-2xl font-bold">
                        Bs. 150
                    </h2>

                </div>


            </div>




            <div className="flex gap-4 mb-6">


                <button
                className="
                bg-green-600
                text-white
                px-5
                py-3
                rounded-lg"
                >

                    Abrir caja

                </button>



                <button
                className="
                bg-red-700
                text-white
                px-5
                py-3
                rounded-lg"
                >

                    Cerrar caja

                </button>


            </div>





            <div className="bg-white shadow rounded-xl overflow-hidden">


                <table className="w-full">


                    <thead className="bg-gray-100">

                        <tr>

                            <th className="p-4 text-left">
                                Tipo
                            </th>

                            <th className="p-4 text-left">
                                Concepto
                            </th>

                            <th className="p-4 text-left">
                                Usuario
                            </th>

                            <th className="p-4 text-left">
                                Monto
                            </th>

                        </tr>

                    </thead>



                    <tbody>


                    {
                        movimientos.map(movimiento=>(

                            <tr
                            key={movimiento.id}
                            className="border-t"
                            >


                                <td className="p-4">


                                    {
                                        movimiento.tipo === "Ingreso"
                                        ?

                                        <span className="flex items-center gap-2 text-green-600">
                                            <ArrowUpCircle size={20}/>
                                            Ingreso
                                        </span>

                                        :

                                        <span className="flex items-center gap-2 text-red-600">
                                            <ArrowDownCircle size={20}/>
                                            Egreso
                                        </span>
                                    }


                                </td>


                                <td className="p-4">
                                    {movimiento.concepto}
                                </td>


                                <td className="p-4">
                                    {movimiento.usuario}
                                </td>


                                <td className="p-4 font-bold">
                                    Bs. {movimiento.monto}
                                </td>


                            </tr>


                        ))
                    }


                    </tbody>


                </table>


            </div>



        </div>

    )

}


export default Caja;